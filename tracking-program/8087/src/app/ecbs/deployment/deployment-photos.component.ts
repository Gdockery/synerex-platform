import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-photos',
  templateUrl: './deployment-photos.component.html',
  styleUrls: ['./deployment-photos.component.scss'],
})
export class DeploymentPhotosComponent implements OnInit {
  depId: number = 0;
  photos: any[] = [];
  loading = true;
  showAdd = false;
  newPhoto: any = { photo_type: 'Installation', description: '', file_url: '' };
  saving = false;
  filterType = '';
  lightbox: any = null;

  readonly PHOTO_TYPES = [
    'Pre-Installation', 'Installation', 'Post-Installation',
    'CT Wiring', 'Panel View', 'Nameplate', 'Issue', 'Closeout'
  ];

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiRequestService) {}

  ngOnInit() {
    this.route.params.subscribe((p: any) => {
      this.depId = Number(p['id']);
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.api.get('/api/dep/deployments/' + this.depId + '/photos').subscribe({
      next: (r: any) => {
        this.photos = (r && r.response) ? r.response : [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  get filtered(): any[] {
    if (!this.filterType) return this.photos;
    var result: any[] = [];
    for (var i = 0; i < this.photos.length; i++) {
      if (this.photos[i].photo_type === this.filterType) result.push(this.photos[i]);
    }
    return result;
  }

  addPhoto() {
    if (!this.newPhoto.file_url && !this.newPhoto.description) return;
    this.saving = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/photos', {
      photo_type: this.newPhoto.photo_type,
      description: this.newPhoto.description,
      file_url: this.newPhoto.file_url,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showAdd = false;
        this.newPhoto = { photo_type: 'Installation', description: '', file_url: '' };
        this.load();
      },
      error: () => { this.saving = false; },
    });
  }

  openLightbox(p: any) { this.lightbox = p; }
  closeLightbox() { this.lightbox = null; }

  fmtDate(ms: any): string {
    if (!ms) return '—';
    return new Date(Number(ms)).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  goBack() { this.router.navigate(['/ecbs/deployment', this.depId]); }
}
