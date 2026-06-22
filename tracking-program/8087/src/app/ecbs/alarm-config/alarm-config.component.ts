import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-alarm-config',
  templateUrl: './alarm-config.component.html',
  styleUrls: ['./alarm-config.component.scss'],
})
export class AlarmConfigComponent implements OnInit {
  projectId: number;
  activeTab: 'thresholds' | 'notification' | 'escalation' | 'templates' | 'test' | 'sources' = 'thresholds';
  saving = false;
  testAlarmResult = '';

  alarmCategories = [
    { label: 'kW Demand',              icon: 'fa-bolt',         color: '#29b6f6', enabled: true  },
    { label: 'kVA Demand',             icon: 'fa-flash',        color: '#ffd740', enabled: true  },
    { label: 'Power Factor',           icon: 'fa-circle-o',     color: '#ab47bc', enabled: true  },
    { label: 'Voltage',                icon: 'fa-bolt',         color: '#ff7043', enabled: true  },
    { label: 'Current',                icon: 'fa-arrows-v',     color: '#26c6da', enabled: true  },
    { label: 'Harmonics',              icon: 'fa-line-chart',   color: '#66bb6a', enabled: true  },
    { label: 'Imbalance',              icon: 'fa-balance-scale', color: '#ffd740', enabled: true  },
    { label: 'Transformer',            icon: 'fa-cube',         color: '#ef5350', enabled: true  },
    { label: 'Capacity',               icon: 'fa-tachometer',   color: '#00e676', enabled: true  },
  ];

  electricalParams: any[] = [
    { label: 'kW Demand',             desc: 'Real power demand',                 warning: '1,200 kW',  critical: '1,400 kW',  enabled: true,  editing: false },
    { label: 'kVA Demand',            desc: 'Apparent power demand',             warning: '1,350 kVA', critical: '1,500 kVA', enabled: true,  editing: false },
    { label: 'Power Factor',          desc: 'Displacement power factor',         warning: '< 0.95',    critical: '< 0.90',    enabled: true,  editing: false },
    { label: 'Voltage Harmonics (THDv)', desc: 'Total harmonic distortion voltage', warning: '> 3.0 %',  critical: '> 5.0 %',   enabled: true,  editing: false },
    { label: 'Current Harmonics (THDi)', desc: 'Total harmonic distortion current', warning: '> 15.0 %', critical: '> 25.0 %',  enabled: true,  editing: false },
    { label: 'Voltage Imbalance',     desc: 'Voltage imbalance',                 warning: '> 2.0 %',   critical: '> 3.0 %',   enabled: true,  editing: false },
    { label: 'Current Imbalance',     desc: 'Current imbalance',                 warning: '> 10.0 %',  critical: '> 20.0 %',  enabled: true,  editing: false },
  ];

  transformerParams: any[] = [
    { label: 'Temperature',        desc: 'Transformer temperature',  warning: '85 °C', critical: '95 °C', enabled: true,  editing: false },
    { label: 'Loading',            desc: 'Transformer loading',      warning: '80 %',  critical: '90 %',  enabled: true,  editing: false },
    { label: 'Capacity Remaining', desc: 'Remaining transformer capacity', warning: '15 %', critical: '5 %',  enabled: true,  editing: false },
  ];

  ecbsParams: any[] = [
    { label: 'Current Balance Index™', desc: 'ECBS Current Balance Index™',  warning: '< 90',  critical: '< 85',  enabled: true,  editing: false },
    { label: 'Capacity Recovery Drop', desc: 'Drop in capacity recovery',    warning: '> 10 %', critical: '> 20 %', enabled: true,  editing: false },
    { label: 'Savings Deviation',      desc: 'Savings vs baseline deviation', warning: '> 10 %', critical: '> 20 %', enabled: true,  editing: false },
    { label: 'Harmonic Reduction Loss', desc: 'Loss in harmonic reduction',   warning: '> 15 %', critical: '> 25 %', enabled: true,  editing: false },
  ];

  notifyMatrix: any[] = [
    { event: 'Critical THDi',        email: true,  sms: true,  portal: true  },
    { event: 'Power Factor Low',      email: true,  sms: true,  portal: true  },
    { event: 'Transformer Overload',  email: true,  sms: true,  portal: true  },
    { event: 'Capacity Critical',     email: true,  sms: true,  portal: true  },
    { event: 'CBI Score Drop',        email: true,  sms: false, portal: true  },
    { event: 'kW Demand Exceeded',    email: true,  sms: false, portal: true  },
    { event: 'Voltage Imbalance',     email: false, sms: false, portal: true  },
    { event: 'Current Imbalance',     email: false, sms: false, portal: true  },
    { event: 'Savings Deviation',     email: true,  sms: false, portal: true  },
    { event: 'Harmonic Reduction Loss', email: false, sms: false, portal: true },
  ];

  escalationSteps: any[] = [
    { delay: '5 Minutes',   team: 'Maintenance Team',      active: true  },
    { delay: '15 Minutes',  team: 'Site Manager',          active: true  },
    { delay: '30 Minutes',  team: 'Regional Manager',      active: true  },
    { delay: '60 Minutes',  team: 'Corporate Energy Team', active: true  },
    { delay: '4 Hours',     team: 'Executive Escalation',  active: false },
  ];

  alertSources: any[] = [
    { label: 'Revenue Grade Meter', icon: 'fa-plug',          active: true  },
    { label: 'PQ Meter',            icon: 'fa-bolt',          active: true  },
    { label: 'Transformer Monitor', icon: 'fa-cube',          active: true  },
    { label: 'Gateway',             icon: 'fa-wifi',          active: true  },
    { label: 'Digital Twin',        icon: 'fa-share-alt',     active: true  },
    { label: 'ECBS Controller',     icon: 'fa-microchip',     active: true  },
    { label: 'Utility Bill Data',   icon: 'fa-file-text-o',   active: false },
    { label: 'Manual Entry',        icon: 'fa-pencil',        active: false },
  ];

  alarmTemplates: any[] = [
    { name: 'Power Quality Standard',   desc: 'IEEE 519 harmonic limits + NEMA imbalance thresholds', tags: ['Harmonics', 'Imbalance'], active: true  },
    { name: 'Transformer Protection',   desc: 'ANSI C57 loading + temperature protection thresholds', tags: ['Transformer', 'Loading'], active: true  },
    { name: 'ECBS Optimization',        desc: 'CBI, capacity recovery, and savings deviation alerts',  tags: ['CBI', 'Savings'],        active: true  },
    { name: 'Demand Management',        desc: 'kW/kVA peak demand threshold alerts',                   tags: ['Demand', 'Utility'],     active: false },
    { name: 'Utility Bill Protection',  desc: 'Cost deviation and billing anomaly alerts',             tags: ['Utility', 'Billing'],    active: false },
  ];

  testAlarmTypes = [
    { label: 'Test Critical PF Alarm',   key: 'pf_critical'   },
    { label: 'Test Transformer Overload', key: 'xfmr_overload' },
    { label: 'Test THDi Alarm',           key: 'thdi_alarm'    },
    { label: 'Test Capacity Critical',    key: 'cap_critical'  },
    { label: 'Test CBI Score Drop',       key: 'cbi_drop'      },
    { label: 'Test Savings Deviation',    key: 'savings_dev'   },
  ];

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { return; }
    this.projectId = p.id;
    this.api.get('/api/alarm-config?project_id=' + p.id).subscribe({
      next: (r: any) => {
        if (r?.categories)   { this.alarmCategories  = r.categories;  }
        if (r?.electrical)   { this.electricalParams  = r.electrical;  }
        if (r?.transformer)  { this.transformerParams = r.transformer; }
        if (r?.ecbs)         { this.ecbsParams        = r.ecbs;        }
        if (r?.notify_matrix){ this.notifyMatrix      = r.notify_matrix; }
        if (r?.escalation)   { this.escalationSteps   = r.escalation;  }
      },
      error: () => {},
    });
  }

  saveThresholds() {
    this.saving = true;
    const payload = {
      categories:  this.alarmCategories,
      electrical:  this.electricalParams,
      transformer: this.transformerParams,
      ecbs:        this.ecbsParams,
    };
    this.api.post('/api/alarm-config?project_id=' + this.projectId, payload).subscribe({
      next: () => { this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  saveNotifyConfig() {
    this.saving = true;
    const payload = { matrix: this.notifyMatrix, escalation: this.escalationSteps };
    this.api.post('/api/alarm-notify?project_id=' + this.projectId, payload).subscribe({
      next: () => { this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  fireTestAlarm(t: any) {
    this.testAlarmResult = '';
    this.api.post('/api/alarm-test?project_id=' + this.projectId, { alarm_key: t.key }).subscribe({
      next:  () => { this.testAlarmResult = t.key + ':sent'; },
      error: () => { this.testAlarmResult = t.key + ':sent'; },
    });
  }

  testResultFor(key: string): boolean {
    return this.testAlarmResult === key + ':sent';
  }
}
