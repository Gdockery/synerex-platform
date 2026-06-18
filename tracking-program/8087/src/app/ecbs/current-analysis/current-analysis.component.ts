import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-current-analysis',
  templateUrl: './current-analysis.component.html',
  styleUrls: ['./current-analysis.component.scss'],
})
export class CurrentAnalysisComponent implements OnInit {
  projectId: number;
  loading = true;
  cbi: any = null;
  error: string = null;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.api.get(`/api/current-balance/summary?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.cbi = r; this.loading = false; },
      error: (e: any) => { this.error = e?.error?.error || 'Failed to load.'; this.loading = false; }
    });
  }

  get cbiScore(): number { return this.cbi?.score ?? this.cbi?.cbi_score ?? 0; }
  get cbiGrade(): string {
    const s = this.cbiScore;
    if (s >= 95) return 'A+'; if (s >= 90) return 'A';
    if (s >= 85) return 'B+'; if (s >= 80) return 'B';
    if (s >= 75) return 'C+'; if (s >= 70) return 'C';
    return 'D';
  }
  get cbiGaugeColor(): string {
    const s = this.cbiScore;
    if (s >= 90) return '#00e676';
    if (s >= 75) return '#ffd740';
    return '#f44336';
  }
  get cbiDashoffset(): number {
    const circumference = 2 * Math.PI * 54;
    return circumference - (this.cbiScore / 100) * circumference;
  }
  get cbiStatusLabel(): string {
    const s = this.cbiScore;
    if (s >= 90) return 'Excellent'; if (s >= 80) return 'Good';
    if (s >= 70) return 'Fair'; return 'Poor';
  }

  get lostCapacityPct(): number {
    if (!this.cbi) return 0;
    const harmonic  = this.cbi.harmonic_current_pct  || 0;
    const reactive  = this.cbi.reactive_current_pct  || 0;
    const imbalance = this.cbi.imbalance_pct          || 0;
    const neutral   = this.cbi.neutral_current_pct   || 0;
    return Math.min(100, harmonic + imbalance + neutral * 0.5);
  }
}
