import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  userForm;
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    const { email, password } = this.userForm.value;
    this.userService.login(email, password).subscribe(response => {
      if (response && response.data) {
        localStorage.setItem('token', response.data);
        this.router.navigate(['casovnice']);
      } else if (!response) {
        this.snackBar.open('Uporabniško ime ali geslo nista pravilna!', null, {
          verticalPosition: 'top',
          duration: 3000
        });
      }
    });
  }

}
