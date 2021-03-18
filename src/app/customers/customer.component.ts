import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators'

import { Customer } from './customer';

// without params
// function ratingRange(control: AbstractControl):{[key:string]:boolean | null} {
//   let result = null;
//   if(control.value !== null && (isNaN(control.value) || control.value < 1 || control.value > 5)) {
//     result = {'range': true};
//   }
//   return result;
// }

// with params
function ratingRange(min: number, max: number): ValidatorFn {
  return (control: AbstractControl):{[key:string]:boolean} | null => {
    let result = null;
    if(control.value !== null && (isNaN(control.value) || control.value < min || control.value > max)) {
      result = {'range': true};
    }
    return result;
  }
}

function emailMatcher(control: AbstractControl):{[key:string]:boolean | null} {
  let result = null;
  const emailControl = control.get('email');
  const confirmEmailControl = control.get('confirmEmail');
  if(!emailControl.pristine && !confirmEmailControl.pristine) {
    if(emailControl.value !== confirmEmailControl.value) {
      result = {'match': true};
    }
  }
  return result;
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm: FormGroup;
  customer = new Customer();
  emailMessage: string;

  get addresses(): FormArray {
    return <FormArray>this.customerForm.get('addresses');
  }

  private _validationMessages = {
    required: 'Please enter your email address',
    email: 'Please enter a valid email address'
  };

  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.customerForm = this._formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this._formBuilder.group({
        email: ['', [Validators.required, Validators.email]],
        confirmEmail: ['', [Validators.required, Validators.email]],
      }, {validator: emailMatcher}),
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1, 5)],
      sendCatalog: false,
      addresses: this._formBuilder.array([ this.buildAddress() ])
    });

    this.customerForm.get('notification').valueChanges.subscribe(value => {
      this.setNotification(value);
    });

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.setMessage(emailControl)
    );
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }

  buildAddress(): FormGroup {
    return this._formBuilder.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: ''
    });
  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  populateTestData(): void {
    this.customerForm.patchValue({
      firstName: 'Jesús',
      lastName: 'Quirós',
      sendCatalog: false
    });
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === 'text') {
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }

  setMessage(control: AbstractControl): void {
    this.emailMessage = '';
    console.log('control.touched', control.touched);
    if((control.touched || control.dirty) && control.errors) {
      this.emailMessage = Object.keys(control.errors).map(
        key => this._validationMessages[key]).join(' ');
    }
  }

}
