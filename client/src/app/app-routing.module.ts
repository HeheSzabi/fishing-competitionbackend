import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompetitionListComponent } from './components/competition-list/competition-list.component';
import { CompetitionDetailComponent } from './components/competition-detail/competition-detail.component';
import { CompetitionWizardComponent } from './components/competition-wizard/competition-wizard.component';
import { ParticipantManagementComponent } from './components/participant-management/participant-management.component';
import { WeighInComponent } from './components/weigh-in/weigh-in.component';
import { ResultsComponent } from './components/results/results.component';

const routes: Routes = [
  { path: '', redirectTo: '/competitions', pathMatch: 'full' },
  { path: 'competitions', component: CompetitionListComponent },
  { path: 'competitions/new', component: CompetitionWizardComponent },
  { path: 'competitions/:id', component: CompetitionDetailComponent },
  { path: 'competitions/:id/participants', component: ParticipantManagementComponent },
  { path: 'competitions/:id/weigh-in', component: WeighInComponent },
  { path: 'competitions/:id/results', component: ResultsComponent },
  { path: '**', redirectTo: '/competitions' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
