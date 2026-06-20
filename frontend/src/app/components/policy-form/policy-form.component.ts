import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PolicyService, PolicyTypeService } from '../../services/policy.service';
import { FamilyMemberService } from '../../services/family-member.service';
import { InvestmentForecastService } from '../../services/investment-forecast.service';
import { PolicyType, Policy, ApiResponse, FamilyMember, ForecastImpact } from '../../models/models';
import { ToastService } from '../../services/toast.service';
import { InrCurrencyPipe } from '../../pipes/pipes';

@Component({
    selector: 'app-policy-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, InrCurrencyPipe],
    template: `
    <div class="page-container">
      <div class="page-header sticky-header">
        <div class="header-left">
          <button class="btn-icon-back" (click)="goBack()">
            <span class="material-icons-round">arrow_back</span>
          </button>
          <div>
            <h1 class="page-title">{{ isEdit ? (isMutualFund ? 'Edit Investment' : 'Edit Policy') : (isMutualFund ? 'New Investment' : 'New Policy') }}</h1>
            <p class="page-subtitle">{{ isEdit ? 'Update details' : (isMutualFund ? 'Enter investment details' : 'Enter policy information') }}</p>
          </div>
        </div>
      </div>


      <div class="loading-overlay" *ngIf="loading">
        <div class="spinner"></div>
        <p>{{ isEdit ? 'Loading policy...' : 'Creating policy...' }}</p>
      </div>

      <form [formGroup]="policyForm" (ngSubmit)="onSubmit()" *ngIf="!loading">
        <div class="form-grid">
          <!-- Left column -->
          <div class="glass-card">
            <h4 class="section-title">
              <span class="material-icons-round">person</span>
              {{ isMutualFund ? 'Investor / Holder Information' : 'Policy Holder Information' }}
            </h4>

            <div class="form-group">
              <label class="form-label" for="policyHolderName">Full Name *</label>
              <input id="policyHolderName" type="text" class="form-control"
                     formControlName="policyHolderName" placeholder="Enter holder's full name">
              <span class="form-error"
                    *ngIf="policyForm.get('policyHolderName')?.invalid && policyForm.get('policyHolderName')?.touched">
                Full name is required (max 200 chars)
              </span>
            </div>

            <div class="form-group">
              <label class="form-label" for="formEmail">Email(s) *</label>
              <input id="formEmail" type="text" class="form-control"
                     formControlName="email" placeholder="e.g. user1@mail.com, user2@mail.com">
              <span class="form-error"
                    *ngIf="policyForm.get('email')?.invalid && policyForm.get('email')?.touched">
                Email is required
              </span>
            </div>

            <div class="form-group">
              <label class="form-label" for="formPhone">Phone Number</label>
              <input id="formPhone" type="tel" class="form-control"
                     formControlName="phoneNumber" placeholder="e.g. 9876543210">
            </div>

            <div class="form-group">
              <label class="form-label" for="nomineeName">Nominee Name</label>
              <input id="nomineeName" type="text" class="form-control"
                     formControlName="nomineeName" placeholder="Enter nominee's name">
            </div>

            <div class="form-group">
              <label class="form-label" for="nomineeRelation">Nominee Relationship</label>
              <select id="nomineeRelation" class="form-control" formControlName="nomineeRelation">
                <option value="">Select relationship</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="familyMemberId">Family Member *</label>
              <select id="familyMemberId" class="form-control" formControlName="familyMemberId">
                <option [ngValue]="null">Select family member</option>
                <option *ngFor="let member of familyMembers" [ngValue]="member.id">
                  {{ member.name }} ({{ member.relationship }})
                </option>
              </select>
              <span class="form-error"
                    *ngIf="policyForm.get('familyMemberId')?.invalid && policyForm.get('familyMemberId')?.touched">
                Please select a family member
              </span>
            </div>

            <div class="form-group">
              <label class="form-label" for="ageAtInception">Age at Inception (Years)</label>
              <input id="ageAtInception" type="number" class="form-control"
                     formControlName="ageAtInception" placeholder="e.g. 35" min="0">
            </div>
          </div>

          <!-- Right column -->
          <div class="glass-card">
            <h4 class="section-title">
              <span class="material-icons-round">description</span>
              {{ isMutualFund ? 'Investment Details' : 'Policy Details' }}
            </h4>

            <div class="form-group">
              <label class="form-label" for="policyNumber">Policy Number *</label>
              <input id="policyNumber" type="text" class="form-control"
                     formControlName="policyNumber" placeholder="Enter policy number">
              <span class="form-error"
                    *ngIf="policyForm.get('policyNumber')?.invalid && policyForm.get('policyNumber')?.touched">
                Policy number is required (max 50 chars)
              </span>
            </div>

            <div class="form-group">
              <label class="form-label" for="policyTypeId">Policy Type *</label>
              <div class="d-flex gap-sm">
                <select id="policyTypeId" class="form-control" formControlName="policyTypeId" style="flex:1">
                  <option [ngValue]="null" disabled>Select policy type</option>
                  <option *ngFor="let type of policyTypes" [ngValue]="type.id">{{ type.name }}</option>
                </select>
                <button type="button" class="btn btn-secondary btn-icon" (click)="showQuickAddType = true" title="Add New Type">
                  <span class="material-icons-round">add</span>
                </button>
              </div>
              <span class="form-error"
                    *ngIf="policyForm.get('policyTypeId')?.invalid && policyForm.get('policyTypeId')?.touched">
                Please select a policy type
              </span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="premiumAmount">{{ isMutualFund ? 'SIP / Investment Amount (₹) *' : 'Premium Amount (₹) *' }}</label>
                <input id="premiumAmount" type="number" class="form-control"
                       formControlName="premiumAmount" [placeholder]="isMutualFund ? 'SIP amount' : '0.00'" min="0">
                <span class="form-error"
                      *ngIf="policyForm.get('premiumAmount')?.invalid && policyForm.get('premiumAmount')?.touched">
                  {{ isMutualFund ? 'Investment amount must be greater than 0' : 'Premium must be greater than 0' }}
                </span>
              </div>
              <div class="form-group">
                <label class="form-label" for="coverageAmount">{{ isMutualFund ? 'Target / Estimated Returns (₹)' : 'Coverage Amount (₹)' }}</label>
                <input id="coverageAmount" type="number" class="form-control"
                       formControlName="coverageAmount" placeholder="0.00" min="0">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="startDate">Start Date *</label>
                <input id="startDate" type="date" class="form-control" formControlName="startDate">
                <span class="form-error"
                      *ngIf="policyForm.get('startDate')?.invalid && policyForm.get('startDate')?.touched">
                  Start date is required
                </span>
              </div>
              <div class="form-group">
                <label class="form-label" for="endDate">End Date *</label>
                <input id="endDate" type="date" class="form-control" formControlName="endDate">
                <span class="form-error"
                      *ngIf="policyForm.get('endDate')?.invalid && policyForm.get('endDate')?.touched">
                  End date is required
                </span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="installmentType">{{ isMutualFund ? 'Investment / SIP Frequency' : 'Installment Type' }}</label>
                <select id="installmentType" class="form-control" formControlName="installmentType">
                  <option value="">{{ isMutualFund ? 'Select Frequency' : 'Select type' }}</option>
                  <option value="Monthly">{{ isMutualFund ? 'Monthly (SIP)' : 'Monthly' }}</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="One Time">{{ isMutualFund ? 'One-Time / Lump Sum' : 'One Time' }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="nextInstallmentDate">{{ isMutualFund ? 'Next SIP / Payment Date' : 'Next Installment Date' }}</label>
                <input id="nextInstallmentDate" type="date" class="form-control" formControlName="nextInstallmentDate">
              </div>
            </div>

            <div class="form-group" *ngIf="isEdit">
              <label class="form-label" for="status">Status *</label>
              <select id="status" class="form-control" formControlName="status">
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Lapsed">Lapsed</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="description">General Description</label>
              <textarea id="description" class="form-control" formControlName="description"
                        rows="2" placeholder="Brief overview..."></textarea>
            </div>
          </div>

          <!-- Document Upload & AI Analysis Section -->
          <div class="glass-card" style="grid-column: 1 / -1">
            <h4 class="section-title">
              <span class="material-icons-round">auto_awesome</span>
              AI Smart Fill & Documents
            </h4>
            
            <div class="form-grid">
              <div class="doc-upload-box">
                <div class="doc-header">
                  <span class="material-icons-round">description</span>
                  <label>Policy Document</label>
                </div>
                <div class="upload-area" [class.has-file]="policyFile">
                  <input type="file" #policyInput (change)="onFileSelected($event, 'Policy')" hidden accept=".pdf,.jpg,.jpeg,.png">
                  <div class="upload-placeholder" *ngIf="!policyFile" (click)="policyInput.click()">
                    <span class="material-icons-round">upload_file</span>
                    <p>Click to upload Policy PDF/Image</p>
                  </div>
                  <div class="file-info" *ngIf="policyFile">
                    <span class="file-name">{{ policyFile.name }}</span>
                    <button type="button" class="btn-text text-danger" (click)="policyFile = null">Remove</button>
                  </div>
                </div>
                <div class="doc-actions mt-sm" *ngIf="policyFile">
                  <button type="button" class="btn btn-primary btn-sm w-100" (click)="autoFillFromDocument()" [disabled]="parsing">
                    <span class="spinner" style="width:14px;height:14px" *ngIf="parsing"></span>
                    <span class="material-icons-round" style="font-size:16px" *ngIf="!parsing">psychology</span>
                    {{ parsing ? 'Analyzing...' : 'Scan & Auto-fill Details' }}
                  </button>
                </div>
              </div>

              <div class="doc-upload-box">
                <div class="doc-header">
                  <span class="material-icons-round">receipt_long</span>
                  <label>Payment Receipt / Proof</label>
                </div>
                <div class="upload-area" [class.has-file]="receiptFile">
                  <input type="file" #receiptInput (change)="onFileSelected($event, 'Receipt')" hidden accept=".pdf,.jpg,.jpeg,.png">
                  <div class="upload-placeholder" *ngIf="!receiptFile" (click)="receiptInput.click()">
                    <span class="material-icons-round">file_present</span>
                    <p>Click to upload Receipt</p>
                  </div>
                  <div class="file-info" *ngIf="receiptFile">
                    <span class="file-name">{{ receiptFile.name }}</span>
                    <button type="button" class="btn-text text-danger" (click)="receiptFile = null">Remove</button>
                  </div>
                </div>
              </div>
            </div>
            <p class="mt-sm text-muted" style="font-size: 0.8rem">
              <span class="material-icons-round" style="font-size: 14px; vertical-align: middle">info</span>
              Uploaded documents will be saved permanently for your reference.
            </p>
          </div>

          <!-- NEW SECTION: Detailed Policy Info -->
          <div class="glass-card" style="grid-column: 1 / -1">
            <h4 class="section-title">
              <span class="material-icons-round">info_outline</span>
              {{ isMutualFund ? 'Extended Investment Details' : 'Extended Policy Details' }}
            </h4>
            
            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label" for="schemeName">{{ isMutualFund ? 'Folio Number' : 'Plan ID' }}</label>
                <input id="schemeName" type="text" class="form-control" formControlName="schemeName" [placeholder]="isMutualFund ? 'e.g. 1234567/89' : ''">
              </div>
              <div class="form-group">
                <label class="form-label" for="companyName">{{ isMutualFund ? 'AMC / Fund House' : 'Company Name' }}</label>
                <input id="companyName" type="text" class="form-control" formControlName="companyName" [placeholder]="isMutualFund ? 'e.g. HDFC Mutual Fund' : ''">
              </div>
              <div class="form-group">
                <label class="form-label" for="productName">{{ isMutualFund ? 'Scheme Name' : 'Product Name' }}</label>
                <input id="productName" type="text" class="form-control" formControlName="productName" [placeholder]="isMutualFund ? 'e.g. Nifty 50 Index Fund' : ''">
              </div>
            </div>

            <div class="form-grid-3 mt-md">
              <div class="form-group">
                <label class="form-label" for="locationUnit">Location / Unit</label>
                <input id="locationUnit" type="text" class="form-control" formControlName="locationUnit">
              </div>
              <div class="form-group">
                <label class="form-label" for="duration">{{ isMutualFund ? 'Lock-in Period (Months/Years)' : 'Duration (Years/Months)' }}</label>
                <input id="duration" type="text" class="form-control" formControlName="duration" [placeholder]="isMutualFund ? 'e.g. 3 Years or None' : ''">
              </div>
              <div class="form-group">
                <label class="form-label" for="gstApplicable">{{ isMutualFund ? 'Exit Load Applicable?' : 'GST Applicable?' }}</label>
                <select id="gstApplicable" class="form-control" formControlName="gstApplicable">
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            </div>

            <div class="form-grid-4 mt-md">
              <div class="form-group">
                <label class="form-label" for="taxAmount">{{ isMutualFund ? 'Stamp Duty / Charges (₹)' : 'Tax Amount (₹)' }}</label>
                <input id="taxAmount" type="number" class="form-control" formControlName="taxAmount">
              </div>
              <div class="form-group">
                <label class="form-label" for="netPremium">{{ isMutualFund ? 'Invested Capital (₹)' : 'Net Premium (₹)' }}</label>
                <input id="netPremium" type="number" class="form-control" formControlName="netPremium">
              </div>
              <div class="form-group">
                <label class="form-label" for="installmentAmount">{{ isMutualFund ? 'SIP / Installment Amount (₹)' : 'Installment Amount (₹)' }}</label>
                <input id="installmentAmount" type="number" class="form-control" formControlName="installmentAmount">
              </div>
              <div class="form-group">
                <label class="form-label" for="totalMaturityAmount">{{ isMutualFund ? 'Current Valuation / Portfolio Value (₹)' : 'Total Maturity Amount (₹)' }}</label>
                <input id="totalMaturityAmount" type="number" class="form-control" formControlName="totalMaturityAmount">
              </div>
            </div>

            <div class="form-grid-3 mt-md">
              <div class="form-group">
                <label class="form-label" for="maturityDate">Maturity Date</label>
                <input id="maturityDate" type="date" class="form-control" formControlName="maturityDate">
              </div>
              <div class="form-group">
                <label class="form-label" for="agentName">Agent Name</label>
                <input id="agentName" type="text" class="form-control" formControlName="agentName">
              </div>
              <div class="form-group">
                <label class="form-label" for="alternateContactNumber">Alt. Contact No.</label>
                <input id="alternateContactNumber" type="text" class="form-control" formControlName="alternateContactNumber">
              </div>
            </div>

            <div class="form-group mt-md">
              <label class="form-label" for="bankAccountDetails">Bank Account Details</label>
              <input id="bankAccountDetails" type="text" class="form-control" formControlName="bankAccountDetails" placeholder="Bank name, A/C number, etc.">
            </div>

            <h5 class="sub-section-title mt-lg mb-md">
              <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 6px; color: var(--color-primary-light);">account_balance_wallet</span>
              Annuity & Auto Debit Details
            </h5>
            <div class="form-grid-4">
              <div class="form-group">
                <label class="form-label" for="annuityDate">Annuity Date</label>
                <input id="annuityDate" type="date" class="form-control" formControlName="annuityDate">
              </div>
              <div class="form-group">
                <label class="form-label" for="annuityAmount">Annuity Amount (₹)</label>
                <input id="annuityAmount" type="number" class="form-control" formControlName="annuityAmount" placeholder="0.00" min="0">
              </div>
              <div class="form-group">
                <label class="form-label" for="autoDebit">Auto Debit Enabled?</label>
                <select id="autoDebit" class="form-control" formControlName="autoDebit">
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="termYears">Term Years</label>
                  <input id="termYears" type="number" class="form-control" formControlName="termYears" placeholder="e.g. 15" min="0">
                </div>
                <div class="form-group">
                  <label class="form-label" for="payingTerm">Paying Term</label>
                  <input id="payingTerm" type="number" class="form-control" formControlName="payingTerm" placeholder="e.g. 10" min="0">
                </div>
              </div>
            </div>

            <div class="form-grid-2 mt-md">
              <div class="form-group">
                <label class="form-label" for="coverageDescription">Coverage Description</label>
                <textarea id="coverageDescription" class="form-control" formControlName="coverageDescription" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label" for="specialRemarks">Special Remarks</label>
                <textarea id="specialRemarks" class="form-control" formControlName="specialRemarks" rows="3"></textarea>
              </div>
            </div>

            <div class="form-group mt-md">
              <label class="form-label" for="additionalDetails">Additional Details</label>
              <textarea id="additionalDetails" class="form-control" formControlName="additionalDetails" rows="3"></textarea>
            </div>
          </div>
        </div>

        <!-- Forecast Impact Preview -->
        <div class="glass-card forecast-impact-card" style="grid-column: 1 / -1" *ngIf="!isEdit && forecastImpact">
          <h4 class="section-title">
            <span class="material-icons-round" style="color:#06b6d4">trending_up</span>
            Forecast Impact Preview
          </h4>
          <div class="impact-grid">
            <div class="impact-stat">
              <span class="impact-label">Current Yearly</span>
              <span class="impact-value">{{ forecastImpact.currentYearlyTotal | inrCurrency }}</span>
            </div>
            <div class="impact-stat">
              <span class="material-icons-round impact-arrow">arrow_forward</span>
            </div>
            <div class="impact-stat">
              <span class="impact-label">New Yearly</span>
              <span class="impact-value text-accent">{{ forecastImpact.newYearlyTotal | inrCurrency }}</span>
            </div>
            <div class="impact-stat">
              <span class="impact-label">Change</span>
              <span class="impact-value" [class.text-danger]="forecastImpact.monthlyChange > 0"
                    [class.text-success]="forecastImpact.monthlyChange <= 0">
                +{{ forecastImpact.monthlyChange | inrCurrency }}/mo
              </span>
            </div>
          </div>
          <p class="impact-summary">{{ forecastImpact.impactSummary }}</p>
        </div>

        <!-- Validation Summary -->
        <div class="validation-summary mb-md text-danger" *ngIf="policyForm.invalid && !loading" style="font-size:0.85rem; padding: 16px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-md)">
          <span class="material-icons-round" style="font-size:16px;vertical-align:middle;margin-right:4px">error_outline</span>
          Please correct the errors in the form before saving.
          <div style="margin-top:4px;padding-left:20px;opacity:0.8">
            <div *ngIf="policyForm.get('policyNumber')?.invalid">- Policy Number is required (Max 50 chars)</div>
            <div *ngIf="policyForm.get('policyHolderName')?.invalid">- Holder Name is required (Max 200 chars)</div>
            <div *ngIf="policyForm.get('email')?.invalid">- Email is required</div>
            <div *ngIf="policyForm.get('policyTypeId')?.invalid">- Policy Type selection is required</div>
            <div *ngIf="policyForm.get('premiumAmount')?.invalid">- Premium must be at least 0.01</div>
            <div *ngIf="policyForm.get('startDate')?.invalid">- Start Date is required</div>
            <div *ngIf="policyForm.get('endDate')?.invalid">- End Date is required</div>
          </div>
        </div>

        <!-- Submit & Error Summary -->
        <div class="form-actions mt-lg">
          <div class="d-flex gap-md">
            <button type="button" class="btn btn-secondary btn-lg" (click)="goBack()">Cancel</button>
            <button type="submit" class="btn btn-primary btn-lg" [disabled]="policyForm.invalid || submitting">
              <span class="spinner" style="width:18px;height:18px;border-width:2px" *ngIf="submitting"></span>
              <span *ngIf="!submitting">
                <span class="material-icons-round" style="font-size:18px;vertical-align:middle;margin-right:4px">
                  {{ isEdit ? 'save' : 'add_circle' }}
                </span>
                {{ isEdit ? (isMutualFund ? 'Update Investment' : 'Update Policy') : (isMutualFund ? 'Create Investment' : 'Create Policy') }}
              </span>
            </button>
          </div>
        </div>
      </form>

      <!-- AI Extraction Verification Modal -->
      <div class="modal-overlay" *ngIf="showVerificationModal" (click)="showVerificationModal = false">
        <div class="modal-content glass-card verification-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="d-flex align-center gap-sm">
              <span class="material-icons-round text-accent">psychology</span>
              <h4>Verify Extracted Details</h4>
            </div>
            <p class="text-muted" style="font-size: 0.8rem">AI has extracted these details from your document. Please verify them before applying.</p>
          </div>
          
          <div class="modal-body mt-md">
            <div class="verification-grid" *ngIf="extractedData">
              <div class="verify-item">
                <label>Policy Holder</label>
                <div class="value">{{ extractedData.policyHolderName || 'Not found' }}</div>
              </div>
              <div class="verify-item">
                <label>Policy Number</label>
                <div class="value">{{ extractedData.policyNumber || 'Not found' }}</div>
              </div>
              <div class="verify-item">
                <label>Company</label>
                <div class="value">{{ extractedData.companyName || 'Not found' }}</div>
              </div>
              <div class="verify-item">
                <label>Product</label>
                <div class="value">{{ extractedData.productName || 'Not found' }}</div>
              </div>
              <div class="verify-item">
                <label>Premium</label>
                <div class="value">{{ extractedData.premiumAmount | inrCurrency }}</div>
              </div>
              <div class="verify-item">
                <label>Coverage</label>
                <div class="value">{{ extractedData.coverageAmount | inrCurrency }}</div>
              </div>
              <div class="verify-item">
                <label>Start Date</label>
                <div class="value">{{ extractedData.startDate || 'Not found' }}</div>
              </div>
              <div class="verify-item">
                <label>End Date</label>
                <div class="value">{{ extractedData.endDate || 'Not found' }}</div>
              </div>
              <div class="verify-item">
                <label>Installment</label>
                <div class="value">{{ extractedData.installmentType || 'Not found' }}</div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer mt-lg">
            <button class="btn btn-secondary" (click)="showVerificationModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="confirmExtraction()">
              <span class="material-icons-round" style="font-size:18px;margin-right:4px">check_circle</span>
              Apply & Fill Form
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Add Policy Type Modal -->
      <div class="modal-overlay" *ngIf="showQuickAddType" (click)="showQuickAddType = false">
        <div class="modal-content glass-card" (click)="$event.stopPropagation()" style="max-width:400px">
          <div class="modal-header">
            <h4>Add New Policy Type</h4>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="newPolicyTypeName">Type Name *</label>
              <input id="newPolicyTypeName" type="text" class="form-control" 
                     [(ngModel)]="newPolicyTypeName" placeholder="e.g. Life Insurance">
            </div>
            <div class="form-group mt-md">
              <label class="form-label" for="newPolicyTypeDesc">Description</label>
              <textarea id="newPolicyTypeDesc" class="form-control" 
                        [(ngModel)]="newPolicyTypeDesc" rows="3" placeholder="Brief description..."></textarea>
            </div>
          </div>
          <div class="modal-footer mt-lg">
            <button class="btn btn-secondary" (click)="showQuickAddType = false">Cancel</button>
            <button class="btn btn-primary" (click)="quickAddType()" 
                    [disabled]="!newPolicyTypeName.trim() || addingType">
              <span class="spinner" style="width:16px;height:16px" *ngIf="addingType"></span>
              {{ addingType ? 'Adding...' : 'Add Type' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container {
      padding-bottom: 120px;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: var(--space-lg);
    }

    .header-left { display: flex; align-items: center; gap: 16px; }

    .btn-icon-back {
      background: transparent;
      border: none;
      color: var(--text-primary);
      padding: 12px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: var(--space-lg);
    }

    .glass-card {
      padding: var(--space-lg);
      border-radius: var(--radius-lg);
    }

    .section-title {
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-size: 0.7rem;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
    }

    .form-group { margin-bottom: 20px; }
    .form-label { font-weight: 600; font-size: 0.85rem; color: var(--text-secondary); }

    .form-control {
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      height: 48px;
      padding: 0 16px;
      border-radius: var(--radius-md);
      font-size: 1rem;
      transition: all var(--transition-base);
    }

    .form-control:focus {
      border-color: var(--color-primary-light);
      background-color: rgba(255, 255, 255, 0.06);
    }

    select.form-control {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right 16px center !important;
      background-size: 18px !important;
      padding-right: 40px !important;
      cursor: pointer;
    }

    select.form-control:focus {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23818cf8'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right 16px center !important;
      background-size: 18px !important;
    }

    select.form-control option {
      background-color: #0f172a;
      color: #cbd5e1;
      padding: 12px;
      font-size: 0.95rem;
    }

    textarea.form-control { height: auto; padding: 12px 16px; }

    .form-row, .form-grid-2, .form-grid-3, .form-grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
    }

    .doc-upload-box {
      background: var(--bg-secondary);
      border: 1.5px dashed var(--border-color);
      border-radius: var(--radius-lg);
      padding: 24px;
      text-align: center;
      transition: all var(--transition-base);
    }

    .doc-upload-box:hover { border-color: var(--color-primary-light); }

    .sub-section-title {
      grid-column: 1 / -1;
      font-weight: 700;
      font-size: 0.8rem;
      color: var(--color-primary-light);
      border-bottom: 1.5px dashed var(--border-color);
      padding-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
    }

    .upload-placeholder { color: var(--text-muted); cursor: pointer; }
    .upload-placeholder .material-icons-round { font-size: 40px; margin-bottom: 8px; }

    /* Floating Footer for Mobile */
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-actions {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--bg-card);
        padding: 16px 24px;
        border-top: 1px solid var(--border-color);
        z-index: 1000;
        display: flex;
        flex-direction: row !important;
        justify-content: space-between;
        align-items: center !important;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.2);
      }

      .btn-lg { flex: 1; height: 50px; font-size: 0.9rem; }
      .form-actions .d-flex { width: 100%; }
    }

  `]
})
export class PolicyFormComponent implements OnInit {
    policyForm!: FormGroup;
    policyTypes: PolicyType[] = [];
    familyMembers: FamilyMember[] = [];
    isEdit = false;

    get isMutualFund(): boolean {
        const typeId = this.policyForm?.get('policyTypeId')?.value;
        if (!typeId) return false;
        const selectedType = this.policyTypes.find(t => t.id === Number(typeId));
        return selectedType?.name?.toLowerCase() === 'mutual fund';
    }
    policyId: number | null = null;
    loading = false;
    submitting = false;

    // Quick Add Type State
    showQuickAddType = false;
    addingType = false;
    newPolicyTypeName = '';
    newPolicyTypeDesc = '';

    // Document State
    policyFile: File | null = null;
    receiptFile: File | null = null;
    parsing = false;
    uploading = false;

    // Extraction Verification
    showVerificationModal = false;
    extractedData: any = null;

    // Forecast Impact
    forecastImpact: ForecastImpact | null = null;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private policyService: PolicyService,
        private policyTypeService: PolicyTypeService,
        private familyMemberService: FamilyMemberService,
        private forecastService: InvestmentForecastService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.initForm();

        // Load policy types
        this.policyTypeService.getAll().subscribe(res => {
            this.policyTypes = res.data;
        });

        // Load family members
        this.familyMemberService.getAll().subscribe(res => {
            this.familyMembers = res.data;
        });

        // Check if copying or editing
        const idParam = this.route.snapshot.paramMap.get('id');
        const copyFromParam = this.route.snapshot.queryParamMap.get('copyFrom');
        if (idParam) {
            this.isEdit = true;
            this.policyId = Number(idParam);
            this.loadPolicy();
        } else if (copyFromParam) {
            this.isEdit = false;
            this.policyId = Number(copyFromParam);
            this.loadPolicy();
        }

        // Watch for changes to compute forecast impact (new policies only)
        if (!this.isEdit) {
            this.policyForm.valueChanges.pipe(
                debounceTime(800),
                distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
            ).subscribe(() => this.computeForecastImpact());
        }

        // Handle "One Time" installment type logic
        this.policyForm.get('installmentType')?.valueChanges.subscribe(val => {
            if (val === 'One Time') {
                this.policyForm.patchValue({ nextInstallmentDate: '' });
                this.policyForm.get('nextInstallmentDate')?.disable();
            } else {
                this.policyForm.get('nextInstallmentDate')?.enable();
            }
        });
    }

    private computeForecastImpact(): void {
        const v = { ...this.policyForm.value };
        if (!v.premiumAmount || !v.installmentType || !v.startDate || !v.endDate) {
            this.forecastImpact = null;
            return;
        }

        // Clean up empty date strings so backend JSON deserializer doesn't fail
        if (v.nextInstallmentDate === '') {
            v.nextInstallmentDate = null;
        }
        if (v.maturityDate === '') {
            v.maturityDate = null;
        }

        this.forecastService.getForecastImpact(v).subscribe({
            next: (res) => { this.forecastImpact = res.data ?? null; },
            error: () => { this.forecastImpact = null; }
        });
    }

    private initForm(): void {
        this.policyForm = this.fb.group({
            policyNumber: ['', [Validators.required, Validators.maxLength(50)]],
            policyHolderName: ['', [Validators.required, Validators.maxLength(200)]],
            email: ['', [Validators.required, Validators.maxLength(1000)]],
            phoneNumber: [''],
            policyTypeId: [null, [Validators.required]],
            premiumAmount: [null, [Validators.required, Validators.min(0.01)]],
            coverageAmount: [null],
            startDate: ['', [Validators.required]],
            endDate: ['', [Validators.required]],
            status: ['Active'],
            description: [''],
            nomineeName: [''],
            nomineeRelation: [''],
            installmentType: [''],
            nextInstallmentDate: [''],
            schemeName: [''],
            companyName: [''],
            productName: [''],
            locationUnit: [''],
            duration: [''],
            coverageDescription: [''],
            taxAmount: [null],
            gstApplicable: ['N'],
            installmentAmount: [null],
            netPremium: [null],
            bankAccountDetails: [''],
            agentName: [''],
            alternateContactNumber: [''],
            specialRemarks: [''],
            maturityDate: [''],
            totalMaturityAmount: [null],
            additionalDetails: [''],
            ageAtInception: [null],
            annuityDate: [''],
            annuityAmount: [null],
            autoDebit: ['N'],
            termYears: [null],
            payingTerm: [null],
            familyMemberId: [null, [Validators.required]]
        });
    }

    private loadPolicy(): void {
        this.loading = true;
        this.policyService.getPolicyById(this.policyId!).subscribe({
            next: (res) => {
                const p = res.data;
                this.policyForm.patchValue({
                    policyNumber: this.isEdit ? p.policyNumber : `${p.policyNumber} - Copy`,
                    policyHolderName: p.policyHolderName,
                    email: p.email,
                    phoneNumber: p.phoneNumber || '',
                    policyTypeId: p.policyTypeId,
                    premiumAmount: p.premiumAmount,
                    coverageAmount: p.coverageAmount,
                    startDate: this.formatDate(p.startDate),
                    endDate: this.formatDate(p.endDate),
                    status: p.status,
                    description: p.description || '',
                    nomineeName: p.nomineeName || '',
                    nomineeRelation: p.nomineeRelation || '',
                    installmentType: p.installmentType || '',
                    nextInstallmentDate: p.nextInstallmentDate ? this.formatDate(p.nextInstallmentDate) : '',
                    schemeName: p.schemeName || '',
                    companyName: p.companyName || '',
                    productName: p.productName || '',
                    locationUnit: p.locationUnit || '',
                    duration: p.duration || '',
                    coverageDescription: p.coverageDescription || '',
                    taxAmount: p.taxAmount,
                    gstApplicable: p.gstApplicable || 'N',
                    installmentAmount: p.installmentAmount,
                    netPremium: p.netPremium,
                    bankAccountDetails: p.bankAccountDetails || '',
                    agentName: p.agentName || '',
                    alternateContactNumber: p.alternateContactNumber || '',
                    specialRemarks: p.specialRemarks || '',
                    maturityDate: p.maturityDate ? this.formatDate(p.maturityDate) : '',
                    totalMaturityAmount: p.totalMaturityAmount,
                    additionalDetails: p.additionalDetails || '',
                    ageAtInception: p.ageAtInception,
                    annuityDate: p.annuityDate ? this.formatDate(p.annuityDate) : '',
                    annuityAmount: p.annuityAmount,
                    autoDebit: p.autoDebit || 'N',
                    termYears: p.termYears,
                    payingTerm: p.payingTerm,
                    familyMemberId: p.familyMemberId
                });
                this.policyForm.markAllAsTouched(); // Force validation highlighting
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.router.navigate(['/policies']);
            }
        });
    }

    onSubmit(): void {
        if (this.policyForm.invalid) {
            Object.keys(this.policyForm.controls).forEach(key =>
                this.policyForm.get(key)?.markAsTouched());
            return;
        }

        this.submitting = true;
        const formData = { ...this.policyForm.getRawValue() };

        // Ensure numeric fields are correctly typed
        if (formData.premiumAmount !== null && formData.premiumAmount !== undefined) {
             formData.premiumAmount = Number(formData.premiumAmount);
        }
        if (formData.coverageAmount !== null && formData.coverageAmount !== undefined && formData.coverageAmount !== '') {
             formData.coverageAmount = Number(formData.coverageAmount);
        } else {
             formData.coverageAmount = null;
        }

        ['taxAmount', 'installmentAmount', 'netPremium', 'totalMaturityAmount', 'ageAtInception', 'annuityAmount', 'termYears', 'payingTerm'].forEach(field => {
            if (formData[field] !== null && formData[field] !== undefined && formData[field] !== '') {
                formData[field] = Number(formData[field]);
            } else {
                formData[field] = null;
            }
        });

        // Clean up empty date strings so backend JSON deserializer doesn't fail
        ['nextInstallmentDate', 'maturityDate', 'annuityDate'].forEach(field => {
            if (formData[field] === '') {
                formData[field] = null;
            }
        });

        if (this.isEdit) {
            this.policyService.updatePolicy(this.policyId!, formData).subscribe({
                next: (res) => {
                    if (res.success) {
                        this.uploadDocumentsIfAny(this.policyId!).subscribe(() => {
                            this.submitting = false;
                            this.toast.success('Policy updated successfully');
                            this.router.navigate(['/policies', this.policyId]);
                        });
                    } else {
                        this.submitting = false;
                        this.toast.error(res.message || 'Failed to update policy');
                        if (res.errors && res.errors.length > 0) {
                            res.errors.forEach(err => this.toast.error(err));
                        }
                    }
                },
                error: (err) => {
                    this.submitting = false;
                    const errorMsg = err.error?.message || 'Error occurred while saving';
                    this.toast.error(errorMsg);
                }
            });
        } else {
            this.policyService.createPolicy(formData).subscribe({
                next: (res) => {
                    this.uploadDocumentsIfAny(res.data.id).subscribe(() => {
                        this.submitting = false;
                        this.toast.success('Policy created successfully');
                        this.router.navigate(['/policies', res.data.id]);
                    });
                },
                error: (err) => {
                    this.submitting = false;
                    const errorMsg = err.error?.message || 'Error occurred while saving';
                    this.toast.error(errorMsg);
                }
            });
        }
    }

    onFileSelected(event: any, type: 'Policy' | 'Receipt'): void {
        const file = event.target.files[0];
        if (file) {
            if (type === 'Policy') this.policyFile = file;
            else this.receiptFile = file;
        }
    }

    autoFillFromDocument(): void {
        if (!this.policyFile) return;

        this.parsing = true;
        this.policyService.parseDocument(this.policyFile).subscribe({
            next: (res) => {
                this.parsing = false;
                if (res.success && res.data) {
                    this.extractedData = res.data;
                    this.showVerificationModal = true;
                } else {
                    this.toast.error('AI Analysis failed to extract data.');
                }
            },
            error: () => {
                this.parsing = false;
                this.toast.error('AI Service is currently unavailable.');
            }
        });
    }

    confirmExtraction(): void {
        if (!this.extractedData) return;
        
        const d = this.extractedData;
        this.policyForm.patchValue({
            policyNumber: d.policyNumber || '',
            policyHolderName: d.policyHolderName,
            premiumAmount: d.premiumAmount,
            coverageAmount: d.coverageAmount,
            startDate: d.startDate ? this.formatDate(d.startDate as any) : '',
            endDate: d.endDate ? this.formatDate(d.endDate as any) : '',
            companyName: d.companyName,
            productName: d.productName,
            email: d.email,
            nomineeName: d.nomineeName,
            nomineeRelation: d.nomineeRelation,
            installmentType: d.installmentType,
            maturityDate: d.maturityDate ? this.formatDate(d.maturityDate as any) : '',
            totalMaturityAmount: d.totalMaturityAmount,
            ageAtInception: d.ageAtInception,
            annuityDate: d.annuityDate ? this.formatDate(d.annuityDate as any) : '',
            annuityAmount: d.annuityAmount,
            autoDebit: d.autoDebit || 'N',
            termYears: d.termYears,
            payingTerm: d.payingTerm,
            description: d.description
        });
        
        this.showVerificationModal = false;
        this.toast.success('Form populated with extracted details.');
    }

    private uploadDocumentsIfAny(policyId: number): Observable<any> {
        const tasks: Observable<any>[] = [];
        if (this.policyFile) {
            tasks.push(this.policyService.uploadDocument(policyId, this.policyFile, 'Policy'));
        }
        if (this.receiptFile) {
            tasks.push(this.policyService.uploadDocument(policyId, this.receiptFile, 'Receipt'));
        }
        return tasks.length > 0 ? forkJoin(tasks) : of(null);
    }

    private formatDate(dateStr: string): string {
        if (!dateStr) return '';
        // Extract YYYY-MM-DD directly from the string to avoid timezone shifts
        // Server usually returns ISO format: "2024-05-16T00:00:00"
        return dateStr.substring(0, 10);
    }

    goBack(): void {
        if (this.isEdit) {
            this.router.navigate(['/policies', this.policyId]);
        } else {
            this.router.navigate(['/policies']);
        }
    }

    quickAddType(): void {
        if (!this.newPolicyTypeName.trim()) return;

        this.addingType = true;
        const newType: any = {
            name: this.newPolicyTypeName.trim(),
            description: this.newPolicyTypeDesc.trim(),
            isActive: true
        };

        this.policyTypeService.create(newType).subscribe({
            next: (res: ApiResponse<PolicyType>) => {
                this.addingType = false;
                if (res.success && res.data) {
                    this.toast.success('Policy type added successfully');
                    this.policyTypes.push(res.data);
                    this.policyForm.patchValue({ policyTypeId: res.data.id });
                    this.showQuickAddType = false;
                    this.newPolicyTypeName = '';
                    this.newPolicyTypeDesc = '';
                } else {
                    this.toast.error(res.message || 'Failed to add policy type');
                }
            },
            error: (err: any) => {
                this.addingType = false;
                this.toast.error(err.error?.message || 'Failed to add policy type');
            }
        });
    }
}
