import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email: string;
  password: string;

  constructor() {
    this.email = '';
    this.password = '';
   }
 

  ngOnInit() {
  }

  onSubmit() {
    console.log('submit');
  }
}
