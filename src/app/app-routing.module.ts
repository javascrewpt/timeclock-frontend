import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { TimeclockCrudComponent } from './timeclock-crud/timeclock-crud.component';
import { AuthService as AuthGuard } from './auth.service';


const routes: Routes = [{
  path: '',
  component: LoginComponent,
  canActivate: [AuthGuard]
}, {
  path: 'casovnice/:week',
  component: TimeclockCrudComponent,
  canActivate: [AuthGuard]
}, {
  path: 'casovnice',
  component: TimeclockCrudComponent,
  canActivate: [AuthGuard]
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
