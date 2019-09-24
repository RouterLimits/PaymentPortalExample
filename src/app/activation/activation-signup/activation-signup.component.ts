import { Component, OnInit } from '@angular/core';
import { ActivateService } from '../activate/activate.service';
import { stringToKeyValue } from '@angular/flex-layout/extended/typings/style/style-transforms';
import { Router } from '@angular/router';
import { Validators, FormControl } from '@angular/forms';
import { CustomErrorStateMatcher } from '../activation.component';
import { constructor } from 'q';
import { RlAPIService } from 'src/app/rl-api.service';
import { User, UserCreatedResponse, UserCreatedResponseJSON } from '../../models/user';
import {MatSnackBar} from '@angular/material/snack-bar';

declare var require: any;

import { environment } from '../../../environments/environment';
import { AccountCreatedResponse } from 'src/app/models/account';
import { BillingAuthResponse } from 'src/app/models/billing';
import { StorageMap } from '@ngx-pwa/local-storage';


@Component({
  selector: 'app-activation-signup',
  templateUrl: './activation-signup.component.html',
  styleUrls: ['./activation-signup.component.sass']
})
export class ActivationSignupComponent implements OnInit {
  [x: string]: any;

  private router: Router;
  private rlAPI: RlAPIService;

  env = environment;
  activate: ActivateService;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  selectedCountry: string;
  zip: string;
  phone: string;
  countries = [];

  constructor(router: Router, activate: ActivateService, rlAPI: RlAPIService, private snackBar: MatSnackBar, private storageMap: StorageMap) {
    this.router = router;
    this.activate = activate;
    this.rlAPI = rlAPI;
    this.firstName = '';
    this.lastName = '';
    this.address = '';
    this.city = '';
    this.state = '';
    this.countries = require('../../../assets/countries.json');
    this.selectedCountry = 'US';
    this.zip = '';
    this.phone = '';
  }

  ngOnInit() {
    // Make sure there is an email
    if (!this.activate.getEmail()) {
      this.router.navigateByUrl('activate/email');
    }
  }

  createUser() {

    // Do some simple form validation.
    if (!this.firstName) { this.openSnackBar('First Name is required.', 'Okay'); return;  }
    if (!this.lastName) { this.openSnackBar('Last Name is required.', 'Okay'); return;  }
    if (!this.phone) { this.openSnackBar('Phone number is required.', 'Okay'); return;  }
    if (!this.address) { this.openSnackBar('Street Address is required.', 'Okay'); return; }
    if (!this.city) { this.openSnackBar('City is required.', 'Okay'); return; }
    if (!this.state) { this.openSnackBar('State is required.', 'Okay'); return; }

    const user = new User(
      this.firstName, this.lastName, this.activate.getEmail(),
      this.phone, this.address, undefined, undefined, this.city, this.state, this.selectedCountry, this.zip ? this.zip : undefined);

    this.activate.createUser(user)
    .then((data: UserCreatedResponse) => {
      return this.activate.createAccount(data.UserId);
    })
    .then((data: AccountCreatedResponse) => {
      this.storageMap.delete('auth').subscribe(() => {
          this.storageMap.set('auth', new BillingAuthResponse(data.ApiKey, data.Account.Id)).subscribe(() => {
             return this.activate.updateAccount(true, "ybpn94jx");
          });
        });
    })
    .then( (data: any) => {
      this.router.navigateByUrl('activate/done');
    })
    .catch((err) => {
      if (err.error && err.error.message) {
        return this.openSnackBar(err.error.message, 'Okay', 10000);
      }
    });
  }

  openSnackBar(message: string, action: string, delay: number = 2000) {
    this.snackBar.open(message, action, {
      duration: delay,
    });
  }
}
