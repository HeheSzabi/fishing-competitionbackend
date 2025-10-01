import { Routes } from '@angular/router';
import { HomepageComponent } from './components/homepage/homepage';
import { CompetitionListComponent } from './components/competition-list/competition-list.component';
import { CompetitionDetailComponent } from './components/competition-detail/competition-detail.component';
import { CompetitionWizardComponent } from './components/competition-wizard/competition-wizard.component';
import { ParticipantManagementComponent } from './components/participant-management/participant-management.component';
import { WeighInComponent } from './components/weigh-in/weigh-in.component';
import { ResultsComponent } from './components/results/results.component';
import { ProfileCompletionComponent } from './components/profile-completion/profile-completion.component';
import { ProfileViewComponent } from './components/profile-view/profile-view.component';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'profile', component: ProfileViewComponent, canActivate: [AuthGuard] },
  { path: 'profile/complete', component: ProfileCompletionComponent, canActivate: [AuthGuard] },
  { path: 'competitions', component: CompetitionListComponent },
  { path: 'competitions/new', component: CompetitionWizardComponent, canActivate: [AdminGuard] },
  { path: 'competitions/:id', component: CompetitionDetailComponent },
  { path: 'competitions/:id/edit', component: CompetitionWizardComponent, canActivate: [AdminGuard] },
  { path: 'competitions/:id/participants', component: ParticipantManagementComponent },
  { path: 'competitions/:id/weigh-in', component: WeighInComponent },
  { path: 'competitions/:id/results', component: ResultsComponent },
  { path: '**', redirectTo: '' }
];
