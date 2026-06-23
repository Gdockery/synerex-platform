"""
Maintenance service - ported from api/services/MaintenanceService.js and FileListDiffService.js.
Provides: files listing, update, rollback, remote-status, remote-update, remote-rollback.
Requires update.sh script (path via UPDATE_SCRIPT config).
"""
import json
import os
import subprocess
import tempfile
import time
from pathlib import Path

STATUS_FILE = "/tmp/synerex-update-status"
STATE_READY = "Ready"
STATE_UPDATING = "Updating"
STATE_ROLLING_BACK = "RollingBack"
STATE_ERROR = "Error"


def _script_path(app):
    """Path to update.sh - configurable via UPDATE_SCRIPT."""
    path = app.config.get("UPDATE_SCRIPT", "")
    if path:
        return path
    from app.config import _8087_ROOT
    return str(_8087_ROOT / "update.sh")


def _source_folder(app):
    """Source folder for list-files - defaults to 8087 or /vagrant."""
    path = app.config.get("MAINTENANCE_SOURCE_FOLDER", "")
    if path:
        return path
    from app.config import _8087_ROOT
    if _8087_ROOT.exists():
        return str(_8087_ROOT)
    return "/vagrant"


def _gpg_passphrase(app):
    """GPG passphrase for encrypt/decrypt."""
    return app.config.get("MAINTENANCE_GPG_PASSPHRASE", "")


def _run_script(app, *args, input_data=None, timeout=300):
    """Run update.sh with args. Returns (success, output, error)."""
    script = _script_path(app)
    if not os.path.isfile(script):
        return False, "", f"Update script not found: {script}"
    try:
        result = subprocess.run(
            [script] + list(args),
            capture_output=True,
            timeout=timeout,
            text=True,
            input=input_data,
        )
        if result.returncode != 0:
            return False, result.stdout, result.stderr or f"Exit code {result.returncode}"
        return True, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Script timeout"
    except Exception as e:
        return False, "", str(e)


def decrypt(app, ciphertext):
    """Decrypt GPG message - for key auth. Returns decrypted string or None."""
    pp = _gpg_passphrase(app)
    if not pp:
        return None
    ok, out, _ = _run_script(app, "decrypt", input_data=ciphertext, timeout=10)
    if not ok:
        return None
    return out.strip()


def encrypt(app, message):
    """Encrypt message with GPG."""
    pp = _gpg_passphrase(app)
    if not pp:
        return None
    ok, out, _ = _run_script(app, "encrypt", input_data=message, timeout=10)
    if not ok:
        return None
    return out


def list_files(app, output_path, source_folder=None):
    """Run list-files, write to output_path."""
    src = source_folder or _source_folder(app)
    ok, _, err = _run_script(app, "list-files", output_path, src, timeout=120)
    return ok, err


def pack_file(app, input_path, output_path):
    """Pack a file/list into encrypted archive."""
    ok, _, err = _run_script(app, "pack", input_path, output_path, timeout=60)
    return ok, err


def pack_list(app, filelist_path, output_path):
    """Pack file list into encrypted archive."""
    ok, _, err = _run_script(app, "pack-list", filelist_path, output_path, timeout=120)
    return ok, err


def unpack(app, pack_path, target_folder=None):
    """Unpack encrypted archive."""
    args = [pack_path]
    if target_folder:
        args.append(target_folder)
    ok, _, err = _run_script(app, "unpack", *args, timeout=60)
    return ok, err


def request_apply(app, pack_path, target_folder=None):
    """Request apply via service pipe (requires update service running)."""
    args = [pack_path]
    if target_folder:
        args.append(target_folder)
    ok, _, err = _run_script(app, "request-apply", *args, timeout=5)
    return ok, err


def request_rollback(app, target_folder=None):
    """Request rollback via service pipe."""
    args = []
    if target_folder:
        args.append(target_folder)
    ok, _, err = _run_script(app, "request-rollback", *args, timeout=5)
    return ok, err


def parse_file_list(list_path):
    """Parse list-files output into itemList (folders, files, checksums)."""
    folders = []
    files = []
    checksums = []
    section = None
    try:
        with open(list_path) as f:
            for line in f:
                line = line.rstrip("\n")
                if not line:
                    continue
                if line.startswith("--- ") and line.endswith(" ---"):
                    section = line[4:-4].strip().lower()
                    continue
                if section == "folders":
                    folders.append(line)
                    continue
                if section == "checksums":
                    parts = line.split("\t", 1)
                    if len(parts) == 2:
                        checksums.append(parts[0])
                        files.append(parts[1])
                    else:
                        parts = line.split(None, 1)
                        if len(parts) == 2:
                            checksums.append(parts[0])
                            files.append(parts[1])
    except Exception:
        pass
    return {"folders": folders, "files": files, "checksums": checksums}


def diff_list(local_items, remote_items):
    """Diff local (source) vs remote (target). Returns {delete: {file:[], folder:[]}, send: {file:[], folder:[]}}."""
    ACT_DELETE = "delete"
    ACT_SEND = "send"
    TYPE_FILE = "file"
    TYPE_FOLDER = "folder"

    def folder_node(name, action):
        return {"name": name, "type": TYPE_FOLDER, "action": action, "children": {}}

    def file_node(name, checksum, action):
        return {"name": name, "type": TYPE_FILE, "checksum": checksum, "action": action}

    def undelete(node):
        node.pop("action", None)

    diff_tree = folder_node("", None)

    # 1. Add remote (target) items as Delete
    for i, f in enumerate(remote_items.get("files", [])):
        path = f.replace("\\", "/").split("/")
        leaf = path.pop()
        csum = remote_items.get("checksums", [])
        c = csum[i] if i < len(csum) else ""
        node = diff_tree
        current = ""
        for p in path:
            current += p + "/"
            if p not in node["children"]:
                node["children"][p] = folder_node(current, ACT_DELETE)
            node = node["children"][p]
        node["children"][leaf] = file_node(current + leaf, c, ACT_DELETE)

    for f in remote_items.get("folders", []):
        path = f.replace("\\", "/").split("/")
        node = diff_tree
        current = ""
        for p in path:
            current += p + "/"
            if p not in node["children"]:
                node["children"][p] = folder_node(current, ACT_DELETE)
            node = node["children"][p]

    # 2. Add local (source) items - undelete if same checksum
    for i, f in enumerate(local_items.get("files", [])):
        path = f.replace("\\", "/").split("/")
        leaf = path.pop()
        csum = local_items.get("checksums", [])
        c = csum[i] if i < len(csum) else ""
        node = diff_tree
        current = ""
        for p in path:
            current += p + "/"
            undelete(node)
            if p not in node["children"]:
                node["children"][p] = folder_node(current, ACT_SEND)
            node = node["children"][p]
        if leaf not in node["children"]:
            node["children"][leaf] = file_node(current + leaf, c, ACT_SEND)
        else:
            ex = node["children"][leaf]
            if ex.get("checksum") != c:
                ex["checksum"] = c
                ex["action"] = ACT_SEND
            else:
                undelete(ex)

    for f in local_items.get("folders", []):
        path = f.replace("\\", "/").split("/")
        node = diff_tree
        current = ""
        for p in path:
            current += p + "/"
            undelete(node)
            if p not in node["children"]:
                node["children"][p] = folder_node(current, ACT_SEND)
            else:
                undelete(node["children"][p])
            node = node["children"][p]

    result = {ACT_DELETE: {TYPE_FILE: [], TYPE_FOLDER: []}, ACT_SEND: {TYPE_FILE: [], TYPE_FOLDER: []}}

    def collect(n):
        if n.get("action"):
            result[n["action"]][n["type"]].append(n["name"])
        for c in n.get("children", {}).values():
            collect(c)

    collect(diff_tree)
    return result


def create_file_list_pack(app, pack_path, source_folder=None):
    """Create encrypted pack of file listing. Returns (success, error)."""
    import tempfile
    td = tempfile.mkdtemp(prefix="synerex-maint-list-")
    try:
        list_path = os.path.join(td, "list")
        ok, err = list_files(app, list_path, source_folder)
        if not ok:
            return False, err or "list-files failed"
        ok, err = pack_file(app, list_path, pack_path)
        if not ok:
            return False, err or "pack failed"
        return True, None
    finally:
        import shutil
        try:
            shutil.rmtree(td)
        except Exception:
            pass


def create_update_pack(app, local_list_path, remote_list_path, output_path, source_folder=None):
    """Create update package from local and remote file lists."""
    import tempfile
    src = source_folder or _source_folder(app)
    local_items = parse_file_list(local_list_path)
    remote_items = parse_file_list(remote_list_path)
    diff = diff_list(local_items, remote_items)
    td = tempfile.mkdtemp(prefix="synerex-maint-update-")
    try:
        with open(os.path.join(td, ".newFolders"), "w") as f:
            f.write("\n".join(diff["send"]["folder"]))
        with open(os.path.join(td, ".oldFolders"), "w") as f:
            f.write("\n".join(diff["delete"]["folder"]))
        with open(os.path.join(td, ".oldFiles"), "w") as f:
            f.write("\n".join(diff["delete"]["file"]))
        filelist_lines = ["-C " + td, ".oldFiles", ".oldFolders", ".newFolders", "-C " + src] + diff["send"]["file"]
        with open(os.path.join(td, "fileList"), "w") as f:
            f.write("\n".join(filelist_lines))
        ok, err = pack_list(app, os.path.join(td, "fileList"), output_path)
        if not ok:
            return False, err or "pack-list failed"
        return True, None
    finally:
        import shutil
        try:
            shutil.rmtree(td)
        except Exception:
            pass


class RemoteHost:
    """Client for remote maintenance - calls remote host's maintenance API."""

    def __init__(self, app, host, secret):
        self.app = app
        self.host = host if "://" in host else "http://" + host
        self.host = self.host.rstrip("/")
        self.secret = secret
        self._status = {}

    def set_status(self, data):
        self._status.update(data)

    def get_status(self):
        return self._status

    def _auth_headers(self):
        return {"X-Maintenance-Secret": self.secret}

    def _auth_data(self):
        return {"secret": self.secret}

    def _call(self, endpoint, files=None, data=None, stream=False):
        import requests
        url = f"{self.host}/api/maintenance/{endpoint}"
        auth = self._auth_data()
        if files:
            req_data = auth
            if data:
                req_data.update(data)
            r = requests.post(url, data=req_data, files=files, timeout=600, stream=stream)
        else:
            req_data = data or {}
            req_data.update(auth)
            r = requests.post(url, data=req_data, timeout=600, stream=stream)
        if r.status_code >= 400:
            raise Exception(r.text or f"HTTP {r.status_code}")
        return r

    def get_file_list(self, output_path):
        """Stream remote files endpoint, unpack, extract list to output_path."""
        r = self._call("files", stream=True)
        td = tempfile.mkdtemp(prefix="synerex-maint-remote-")
        try:
            pack_path = os.path.join(td, "pack")
            with open(pack_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            ok, _ = unpack(self.app, pack_path, td)
            if not ok:
                raise Exception("Unpack remote file list failed")
            list_path = os.path.join(td, "list")
            if os.path.isfile(list_path):
                import shutil
                shutil.copy(list_path, output_path)
            else:
                for name in os.listdir(td):
                    if name != "pack":
                        import shutil
                        shutil.copy(os.path.join(td, name), output_path)
                        break
        finally:
            import shutil
            try:
                shutil.rmtree(td)
            except Exception:
                pass

    def update(self):
        """Perform remote update: get remote list, local list, diff, create pack, POST to remote."""
        td = tempfile.mkdtemp(prefix="synerex-maint-update-")
        try:
            remote_list = os.path.join(td, "remoteList")
            local_list = os.path.join(td, "localList")
            self.get_file_list(remote_list)
            ok, _ = list_files(self.app, local_list)
            if not ok:
                raise Exception("Local list-files failed")
            pack_path = os.path.join(td, "updatePack")
            ok, err = create_update_pack(self.app, local_list, remote_list, pack_path)
            if not ok:
                raise Exception(err or "Create update pack failed")
            with open(pack_path, "rb") as f:
                self._call("update", files={"pack": ("pack", f, "application/octet-stream")})
        finally:
            import shutil
            try:
                shutil.rmtree(td)
            except Exception:
                pass

    def rollback(self):
        self._call("rollback")

    def read_status(self):
        try:
            r = self._call("status")
            body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
            self.set_status({"status": body, "time": time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime())})
        except Exception as e:
            self.set_status({"status": str(e), "time": time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime())})
