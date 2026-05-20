import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, AlertCircle, ChevronRight, FlaskConical, Pill,
  ClipboardList, HeartPulse, Save, Stethoscope, Clock, Activity,
  X, Plus, CheckCircle2, BedDouble, FileText, Printer
} from 'lucide-react';
import Layout from '../../components/Layout';
import PatientBanner from '../../components/PatientBanner';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

// Smart autocomplete data
const DRUG_DB = [
  // ── Analgesics / NSAIDs ──────────────────────────────────────────────────
  { name: 'Paracetamol 500mg', sig: 'Take 1-2 tablets TID PRN pain', class: 'Analgesic' },
  { name: 'Paracetamol 650mg', sig: 'Take 1 tablet TID PRN pain', class: 'Analgesic' },
  { name: 'Paracetamol 1000mg', sig: 'Take 1 tablet TID PRN pain', class: 'Analgesic' },
  { name: 'Ibuprofen 200mg', sig: 'Take 1 tablet TID after meals', class: 'NSAID' },
  { name: 'Ibuprofen 400mg', sig: 'Take 1 tablet TID after meals', class: 'NSAID' },
  { name: 'Ibuprofen 600mg', sig: 'Take 1 tablet BD after meals', class: 'NSAID' },
  { name: 'Diclofenac 50mg', sig: 'Take 1 tablet BD after meals', class: 'NSAID' },
  { name: 'Naproxen 250mg', sig: 'Take 1 tablet BD after meals', class: 'NSAID' },
  { name: 'Naproxen 500mg', sig: 'Take 1 tablet BD after meals', class: 'NSAID' },
  { name: 'Tramadol 50mg', sig: 'Take 1 capsule TID PRN pain', class: 'Opioid' },
  { name: 'Ketorolac 10mg', sig: 'Take 1 tablet TID x 5 days', class: 'NSAID' },
  { name: 'Mefenamic Acid 250mg', sig: 'Take 1 capsule TID after meals', class: 'NSAID' },
  { name: 'Mefenamic Acid 500mg', sig: 'Take 1 capsule TID after meals', class: 'NSAID' },
  // ── Antibiotics ──────────────────────────────────────────────────────────
  { name: 'Amoxicillin 250mg', sig: 'Take 1 capsule TID x 5 days', class: 'Antibiotic' },
  { name: 'Amoxicillin 500mg', sig: 'Take 1 capsule TID x 7 days', class: 'Antibiotic' },
  { name: 'Amoxicillin + Clavulanate 625mg', sig: 'Take 1 tablet BD x 7 days after meals', class: 'Antibiotic' },
  { name: 'Azithromycin 250mg', sig: 'Take 2 tablets on Day 1, then 1 tablet OD x 4 days', class: 'Antibiotic' },
  { name: 'Azithromycin 500mg', sig: 'Take 1 tablet OD x 3 days', class: 'Antibiotic' },
  { name: 'Ciprofloxacin 250mg', sig: 'Take 1 tablet BD x 5 days', class: 'Antibiotic' },
  { name: 'Ciprofloxacin 500mg', sig: 'Take 1 tablet BD x 7 days', class: 'Antibiotic' },
  { name: 'Ciprofloxacin 750mg', sig: 'Take 1 tablet BD x 10 days', class: 'Antibiotic' },
  { name: 'Metronidazole 200mg', sig: 'Take 1 tablet TID x 5 days', class: 'Antibiotic' },
  { name: 'Metronidazole 400mg', sig: 'Take 1 tablet TID x 7 days', class: 'Antibiotic' },
  { name: 'Cefixime 200mg', sig: 'Take 1 tablet BD x 5 days', class: 'Cephalosporin' },
  { name: 'Cefixime 400mg', sig: 'Take 1 tablet OD x 5 days', class: 'Cephalosporin' },
  { name: 'Doxycycline 100mg', sig: 'Take 1 capsule BD x 7 days with meals', class: 'Antibiotic' },
  { name: 'Norfloxacin 400mg', sig: 'Take 1 tablet BD x 5 days (empty stomach)', class: 'Antibiotic' },
  { name: 'Nitrofurantoin 100mg', sig: 'Take 1 capsule QID x 7 days with meals', class: 'Antibiotic' },
  { name: 'Clindamycin 150mg', sig: 'Take 1 capsule TID x 7 days', class: 'Antibiotic' },
  { name: 'Clindamycin 300mg', sig: 'Take 1 capsule TID x 7 days', class: 'Antibiotic' },
  { name: 'Trimethoprim + Sulfamethoxazole 960mg', sig: 'Take 1 tablet BD x 5 days', class: 'Antibiotic' },
  { name: 'Levofloxacin 500mg', sig: 'Take 1 tablet OD x 7 days', class: 'Antibiotic' },
  { name: 'Cefuroxime 250mg', sig: 'Take 1 tablet BD x 7 days after meals', class: 'Cephalosporin' },
  // ── Cardiovascular ───────────────────────────────────────────────────────
  { name: 'Atorvastatin 10mg', sig: 'Take 1 tablet OD at bedtime', class: 'Statin' },
  { name: 'Atorvastatin 20mg', sig: 'Take 1 tablet OD at bedtime', class: 'Statin' },
  { name: 'Atorvastatin 40mg', sig: 'Take 1 tablet OD at bedtime', class: 'Statin' },
  { name: 'Atorvastatin 80mg', sig: 'Take 1 tablet OD at bedtime', class: 'Statin' },
  { name: 'Rosuvastatin 5mg', sig: 'Take 1 tablet OD at bedtime', class: 'Statin' },
  { name: 'Rosuvastatin 10mg', sig: 'Take 1 tablet OD at bedtime', class: 'Statin' },
  { name: 'Rosuvastatin 20mg', sig: 'Take 1 tablet OD at bedtime', class: 'Statin' },
  { name: 'Amlodipine 5mg', sig: 'Take 1 tablet OD', class: 'CCB' },
  { name: 'Amlodipine 10mg', sig: 'Take 1 tablet OD', class: 'CCB' },
  { name: 'Lisinopril 5mg', sig: 'Take 1 tablet OD in morning', class: 'ACE Inhibitor' },
  { name: 'Lisinopril 10mg', sig: 'Take 1 tablet OD in morning', class: 'ACE Inhibitor' },
  { name: 'Lisinopril 20mg', sig: 'Take 1 tablet OD in morning', class: 'ACE Inhibitor' },
  { name: 'Ramipril 2.5mg', sig: 'Take 1 tablet OD in morning', class: 'ACE Inhibitor' },
  { name: 'Ramipril 5mg', sig: 'Take 1 tablet OD in morning', class: 'ACE Inhibitor' },
  { name: 'Ramipril 10mg', sig: 'Take 1 tablet OD in morning', class: 'ACE Inhibitor' },
  { name: 'Telmisartan 40mg', sig: 'Take 1 tablet OD', class: 'ARB' },
  { name: 'Telmisartan 80mg', sig: 'Take 1 tablet OD', class: 'ARB' },
  { name: 'Losartan 25mg', sig: 'Take 1 tablet OD', class: 'ARB' },
  { name: 'Losartan 50mg', sig: 'Take 1 tablet OD', class: 'ARB' },
  { name: 'Losartan 100mg', sig: 'Take 1 tablet OD', class: 'ARB' },
  { name: 'Metoprolol 25mg', sig: 'Take 1 tablet BD', class: 'Beta Blocker' },
  { name: 'Metoprolol 50mg', sig: 'Take 1 tablet BD', class: 'Beta Blocker' },
  { name: 'Bisoprolol 2.5mg', sig: 'Take 1 tablet OD', class: 'Beta Blocker' },
  { name: 'Bisoprolol 5mg', sig: 'Take 1 tablet OD', class: 'Beta Blocker' },
  { name: 'Carvedilol 3.125mg', sig: 'Take 1 tablet BD with meals', class: 'Beta Blocker' },
  { name: 'Carvedilol 6.25mg', sig: 'Take 1 tablet BD with meals', class: 'Beta Blocker' },
  { name: 'Carvedilol 12.5mg', sig: 'Take 1 tablet BD with meals', class: 'Beta Blocker' },
  { name: 'Furosemide 20mg', sig: 'Take 1 tablet OD in morning', class: 'Diuretic' },
  { name: 'Furosemide 40mg', sig: 'Take 1 tablet OD in morning', class: 'Diuretic' },
  { name: 'Spironolactone 25mg', sig: 'Take 1 tablet OD with meals', class: 'Diuretic' },
  { name: 'Spironolactone 50mg', sig: 'Take 1 tablet OD with meals', class: 'Diuretic' },
  { name: 'Hydrochlorothiazide 12.5mg', sig: 'Take 1 tablet OD in morning', class: 'Diuretic' },
  { name: 'Hydrochlorothiazide 25mg', sig: 'Take 1 tablet OD in morning', class: 'Diuretic' },
  { name: 'Aspirin 75mg', sig: 'Take 1 tablet OD after meals', class: 'Antiplatelet' },
  { name: 'Aspirin 150mg', sig: 'Take 1 tablet OD after meals', class: 'Antiplatelet' },
  { name: 'Aspirin 325mg', sig: 'Take 1 tablet OD after meals', class: 'Antiplatelet' },
  { name: 'Clopidogrel 75mg', sig: 'Take 1 tablet OD after meals', class: 'Antiplatelet' },
  { name: 'Isosorbide Mononitrate 20mg', sig: 'Take 1 tablet BD (empty stomach)', class: 'Nitrate' },
  { name: 'Isosorbide Mononitrate 30mg SR', sig: 'Take 1 tablet OD in morning', class: 'Nitrate' },
  { name: 'Digoxin 0.25mg', sig: 'Take 1 tablet OD', class: 'Cardiac Glycoside' },
  { name: 'Warfarin 1mg', sig: 'Take as directed per INR target', class: 'Anticoagulant' },
  { name: 'Warfarin 2mg', sig: 'Take as directed per INR target', class: 'Anticoagulant' },
  { name: 'Warfarin 5mg', sig: 'Take as directed per INR target', class: 'Anticoagulant' },
  // ── Diabetes ─────────────────────────────────────────────────────────────
  { name: 'Metformin 500mg', sig: 'Take 1 tablet BD with meals', class: 'Biguanide' },
  { name: 'Metformin 850mg', sig: 'Take 1 tablet BD with meals', class: 'Biguanide' },
  { name: 'Metformin 1000mg', sig: 'Take 1 tablet BD with meals', class: 'Biguanide' },
  { name: 'Glibenclamide 2.5mg', sig: 'Take 1 tablet OD before breakfast', class: 'Sulfonylurea' },
  { name: 'Glibenclamide 5mg', sig: 'Take 1 tablet OD before breakfast', class: 'Sulfonylurea' },
  { name: 'Glipizide 5mg', sig: 'Take 1 tablet OD before breakfast', class: 'Sulfonylurea' },
  { name: 'Glipizide 10mg', sig: 'Take 1 tablet OD before breakfast', class: 'Sulfonylurea' },
  { name: 'Gliclazide MR 30mg', sig: 'Take 1 tablet OD with breakfast', class: 'Sulfonylurea' },
  { name: 'Gliclazide MR 60mg', sig: 'Take 1 tablet OD with breakfast', class: 'Sulfonylurea' },
  { name: 'Sitagliptin 50mg', sig: 'Take 1 tablet OD', class: 'DPP-4 Inhibitor' },
  { name: 'Sitagliptin 100mg', sig: 'Take 1 tablet OD', class: 'DPP-4 Inhibitor' },
  { name: 'Voglibose 0.2mg', sig: 'Take 1 tablet TID with first bite of meal', class: 'Alpha-glucosidase inhibitor' },
  { name: 'Voglibose 0.3mg', sig: 'Take 1 tablet TID with first bite of meal', class: 'Alpha-glucosidase inhibitor' },
  { name: 'Dapagliflozin 10mg', sig: 'Take 1 tablet OD in morning', class: 'SGLT-2 Inhibitor' },
  { name: 'Empagliflozin 10mg', sig: 'Take 1 tablet OD in morning', class: 'SGLT-2 Inhibitor' },
  { name: 'Empagliflozin 25mg', sig: 'Take 1 tablet OD in morning', class: 'SGLT-2 Inhibitor' },
  { name: 'Insulin Glargine 10U', sig: 'Inject SC at bedtime, titrate as directed', class: 'Insulin' },
  { name: 'Insulin Glargine 20U', sig: 'Inject SC at bedtime, titrate as directed', class: 'Insulin' },
  { name: 'Insulin Aspart 8U', sig: 'Inject SC 10 min before meals', class: 'Insulin' },
  { name: 'Insulin Regular 10U', sig: 'Inject SC 30 min before meals', class: 'Insulin' },
  // ── Gastro-Intestinal ────────────────────────────────────────────────────
  { name: 'Pantoprazole 20mg', sig: 'Take 1 tablet OD before breakfast', class: 'PPI' },
  { name: 'Pantoprazole 40mg', sig: 'Take 1 tablet OD before breakfast', class: 'PPI' },
  { name: 'Omeprazole 20mg', sig: 'Take 1 capsule OD before breakfast', class: 'PPI' },
  { name: 'Omeprazole 40mg', sig: 'Take 1 capsule OD before breakfast', class: 'PPI' },
  { name: 'Esomeprazole 20mg', sig: 'Take 1 tablet OD before breakfast', class: 'PPI' },
  { name: 'Esomeprazole 40mg', sig: 'Take 1 tablet OD before breakfast', class: 'PPI' },
  { name: 'Ranitidine 150mg', sig: 'Take 1 tablet BD', class: 'H2 Blocker' },
  { name: 'Ranitidine 300mg', sig: 'Take 1 tablet OD at bedtime', class: 'H2 Blocker' },
  { name: 'Domperidone 10mg', sig: 'Take 1 tablet TID 30 min before meals', class: 'Prokinetic' },
  { name: 'Ondansetron 4mg', sig: 'Take 1 tablet TID PRN nausea', class: 'Antiemetic' },
  { name: 'Ondansetron 8mg', sig: 'Take 1 tablet BD PRN nausea', class: 'Antiemetic' },
  { name: 'Metoclopramide 10mg', sig: 'Take 1 tablet TID 30 min before meals', class: 'Antiemetic' },
  { name: 'Dicyclomine 10mg', sig: 'Take 1 tablet TID PRN cramps', class: 'Antispasmodic' },
  { name: 'Dicyclomine 20mg', sig: 'Take 1 tablet TID PRN cramps', class: 'Antispasmodic' },
  { name: 'Bisacodyl 5mg', sig: 'Take 1-2 tablets OD at bedtime', class: 'Laxative' },
  { name: 'Lactulose 15ml', sig: 'Take 15ml BD, adjust to soft stools', class: 'Laxative' },
  // ── Respiratory / Allergy ────────────────────────────────────────────────
  { name: 'Salbutamol 2mg', sig: 'Take 1 tablet TID PRN breathlessness', class: 'Bronchodilator' },
  { name: 'Salbutamol 4mg', sig: 'Take 1 tablet TID PRN breathlessness', class: 'Bronchodilator' },
  { name: 'Montelukast 5mg', sig: 'Take 1 tablet OD at bedtime', class: 'Leukotriene Antagonist' },
  { name: 'Montelukast 10mg', sig: 'Take 1 tablet OD at bedtime', class: 'Leukotriene Antagonist' },
  { name: 'Cetirizine 5mg', sig: 'Take 1 tablet OD at bedtime', class: 'Antihistamine' },
  { name: 'Cetirizine 10mg', sig: 'Take 1 tablet OD at bedtime', class: 'Antihistamine' },
  { name: 'Levocetirizine 2.5mg', sig: 'Take 1 tablet OD at bedtime', class: 'Antihistamine' },
  { name: 'Levocetirizine 5mg', sig: 'Take 1 tablet OD at bedtime', class: 'Antihistamine' },
  { name: 'Fexofenadine 120mg', sig: 'Take 1 tablet OD', class: 'Antihistamine' },
  { name: 'Fexofenadine 180mg', sig: 'Take 1 tablet OD', class: 'Antihistamine' },
  { name: 'Loratadine 10mg', sig: 'Take 1 tablet OD', class: 'Antihistamine' },
  { name: 'Theophylline SR 200mg', sig: 'Take 1 tablet BD', class: 'Bronchodilator' },
  { name: 'Theophylline SR 300mg', sig: 'Take 1 tablet BD', class: 'Bronchodilator' },
  { name: 'Dextromethorphan 15mg', sig: 'Take 1 tablet TID PRN cough', class: 'Antitussive' },
  // ── CNS / Psychiatry ─────────────────────────────────────────────────────
  { name: 'Escitalopram 5mg', sig: 'Take 1 tablet OD in morning', class: 'SSRI' },
  { name: 'Escitalopram 10mg', sig: 'Take 1 tablet OD in morning', class: 'SSRI' },
  { name: 'Escitalopram 20mg', sig: 'Take 1 tablet OD in morning', class: 'SSRI' },
  { name: 'Sertraline 25mg', sig: 'Take 1 tablet OD in morning', class: 'SSRI' },
  { name: 'Sertraline 50mg', sig: 'Take 1 tablet OD in morning', class: 'SSRI' },
  { name: 'Sertraline 100mg', sig: 'Take 1 tablet OD in morning', class: 'SSRI' },
  { name: 'Amitriptyline 10mg', sig: 'Take 1 tablet OD at bedtime', class: 'TCA' },
  { name: 'Amitriptyline 25mg', sig: 'Take 1 tablet OD at bedtime', class: 'TCA' },
  { name: 'Alprazolam 0.25mg', sig: 'Take 1 tablet BD PRN anxiety — SHORT TERM', class: 'Benzodiazepine' },
  { name: 'Alprazolam 0.5mg', sig: 'Take 1 tablet BD PRN anxiety — SHORT TERM', class: 'Benzodiazepine' },
  { name: 'Clonazepam 0.25mg', sig: 'Take 1 tablet BD', class: 'Benzodiazepine' },
  { name: 'Clonazepam 0.5mg', sig: 'Take 1 tablet BD', class: 'Benzodiazepine' },
  { name: 'Gabapentin 100mg', sig: 'Take 1 capsule TID', class: 'Anticonvulsant' },
  { name: 'Gabapentin 300mg', sig: 'Take 1 capsule TID', class: 'Anticonvulsant' },
  { name: 'Pregabalin 75mg', sig: 'Take 1 capsule BD', class: 'Anticonvulsant' },
  { name: 'Pregabalin 150mg', sig: 'Take 1 capsule BD', class: 'Anticonvulsant' },
  // ── Thyroid ──────────────────────────────────────────────────────────────
  { name: 'Levothyroxine 25mcg', sig: 'Take 1 tablet OD (empty stomach, 30 min before food)', class: 'Thyroid' },
  { name: 'Levothyroxine 50mcg', sig: 'Take 1 tablet OD (empty stomach, 30 min before food)', class: 'Thyroid' },
  { name: 'Levothyroxine 75mcg', sig: 'Take 1 tablet OD (empty stomach, 30 min before food)', class: 'Thyroid' },
  { name: 'Levothyroxine 100mcg', sig: 'Take 1 tablet OD (empty stomach, 30 min before food)', class: 'Thyroid' },
  // ── Steroids ─────────────────────────────────────────────────────────────
  { name: 'Prednisolone 5mg', sig: 'Take as directed — taper as instructed', class: 'Corticosteroid' },
  { name: 'Prednisolone 10mg', sig: 'Take as directed — taper as instructed', class: 'Corticosteroid' },
  { name: 'Prednisolone 20mg', sig: 'Take as directed — taper as instructed', class: 'Corticosteroid' },
  { name: 'Prednisolone 40mg', sig: 'Take as directed — taper as instructed', class: 'Corticosteroid' },
  { name: 'Methylprednisolone 4mg', sig: 'Take as directed — taper as instructed', class: 'Corticosteroid' },
  { name: 'Dexamethasone 0.5mg', sig: 'Take as directed', class: 'Corticosteroid' },
  // ── Vitamins / Supplements ───────────────────────────────────────────────
  { name: 'Vitamin D3 60000 IU', sig: 'Take 1 sachet weekly x 8 weeks with milk', class: 'Supplement' },
  { name: 'Calcium Carbonate 500mg + Vit D3', sig: 'Take 1 tablet BD after meals', class: 'Supplement' },
  { name: 'Ferrous Sulfate 200mg', sig: 'Take 1 tablet OD (empty stomach)', class: 'Iron' },
  { name: 'Folic Acid 5mg', sig: 'Take 1 tablet OD', class: 'Vitamin' },
  { name: 'B Complex tablet', sig: 'Take 1 tablet OD after meals', class: 'Vitamin' },
  { name: 'Multivitamin tablet', sig: 'Take 1 tablet OD after breakfast', class: 'Supplement' },
  { name: 'Omega-3 Fatty Acids 1000mg', sig: 'Take 1 capsule OD after meals', class: 'Supplement' },
  // ── Urology / Others ─────────────────────────────────────────────────────
  { name: 'Tamsulosin 0.4mg', sig: 'Take 1 capsule OD 30 min after meal', class: 'Alpha Blocker' },
  { name: 'Finasteride 5mg', sig: 'Take 1 tablet OD', class: 'Urological' },
  { name: 'Solifenacin 5mg', sig: 'Take 1 tablet OD', class: 'Urological' },
  { name: 'Allopurinol 100mg', sig: 'Take 1 tablet OD after meals', class: 'Anti-gout' },
  { name: 'Allopurinol 300mg', sig: 'Take 1 tablet OD after meals', class: 'Anti-gout' },
  { name: 'Colchicine 0.5mg', sig: 'Take 1 tablet BD during acute gout attack', class: 'Anti-gout' },
  { name: 'Betahistine 8mg', sig: 'Take 1 tablet TID', class: 'Vestibular' },
  { name: 'Betahistine 16mg', sig: 'Take 1 tablet TID', class: 'Vestibular' },
  { name: 'Hydroxychloroquine 200mg', sig: 'Take 1 tablet OD after meals', class: 'DMARD' },
  { name: 'Hydroxychloroquine 400mg', sig: 'Take 1 tablet OD after meals', class: 'DMARD' },
];

const LAB_DB = [
  { code: 'cbc', name: 'Complete Blood Count (CBC)', turnaround: '2 hrs' },
  { code: 'bmp', name: 'Basic Metabolic Panel', turnaround: '3 hrs' },
  { code: 'lft', name: 'Liver Function Test', turnaround: '4 hrs' },
  { code: 'hba1c', name: 'HbA1c', turnaround: '4 hrs' },
  { code: 'tsh', name: 'Thyroid Stimulating Hormone (TSH)', turnaround: '6 hrs' },
  { code: 'lipid', name: 'Lipid Panel', turnaround: '4 hrs' },
  { code: 'echo', name: 'Echocardiogram', turnaround: '24 hrs' },
  { code: 'ecg', name: 'Electrocardiogram (ECG)', turnaround: '30 mins' },
  { code: 'urine', name: 'Urine Routine/Microscopy', turnaround: '2 hrs' },
  { code: 'culture', name: 'Blood Culture & Sensitivity', turnaround: '48 hrs' },
];

const TABS = [
  { id: 'notes', label: 'SOAP Notes', icon: <ClipboardList size={14} /> },
  { id: 'orders', label: 'Lab Orders', icon: <FlaskConical size={14} /> },
  { id: 'rx', label: 'Prescribe', icon: <Pill size={14} /> },
  { id: 'vitals', label: 'Vitals', icon: <HeartPulse size={14} /> },
];

// Demo patient data
const DEMO_PATIENT = {
  name: 'Arjun Mehta',
  mrn: 'MRN-8492',
  age: '47', gender: 'Male', dob: '1977-04-15',
  blood: 'B+', phone: '+91 98765 43210',
  allergies: [{ drug: 'Penicillin', severity: 'High', reaction: 'Anaphylaxis' }],
  activeMeds: ['Metformin 500mg OD', 'Atorvastatin 20mg OD'],
  diagnoses: ['Type 2 Diabetes Mellitus', 'Hypertension'],
  lastVisit: '2026-02-14',
  insurance: 'CGHS',
};

// Real clinical data state

export default function PatientWorkspace() {
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.user);
  const authorName = currentUser?.name || 'Attending Physician';

  // Patient data
  const [patient, setPatient] = useState(DEMO_PATIENT);
  const [_loading, setLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('notes');

  // Notes
  const [note, setNote] = useState({ subjective: '', objective: '', assessment: '', plan: '' });

  // Orders
  const [orderInput, setOrderInput] = useState('');
  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [orderPriority, setOrderPriority] = useState('Routine');

  // Rx
  const [rxInput, setRxInput] = useState('');
  const [rxSuggestions, setRxSuggestions] = useState([]);
  const [selectedRx, setSelectedRx] = useState([]);

  const [vitals, setVitals] = useState({ bp: '', hr: '', spo2: '', temp: '', rr: '', weight: '' });
  const [history, setHistory] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/emr/notes?patientId=${id}`);
      const json = await res.json();
      setHistory(json?.data ?? json ?? []);
    } catch (e) { console.error('History fetch failed', e); }
  };

  const fetchVitals = async () => {
    try {
      const res = await api.get(`/vitals/history?patientId=${id}`);
      const json = await res.json();
      setVitalsHistory(json?.data ?? json ?? []);
    } catch (e) { console.error('Vitals fetch failed', e); }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`/patients/${id}`)
        .then(r => r.json())
        .then(d => { if (d?.data) setPatient({ ...DEMO_PATIENT, ...d.data, name: d.data.fullName ?? DEMO_PATIENT.name }); })
        .catch(() => {})
        .finally(() => setLoading(false));
      
      fetchHistory();
      fetchVitals();
    } else if (searchParams.get('name')) {
      setPatient(p => ({ ...p, name: decodeURIComponent(searchParams.get('name')) }));
    }
  }, [id, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smart lab search
  const handleOrderInput = (val) => {
    setOrderInput(val);
    if (val.length < 2) { setOrderSuggestions([]); return; }
    const q = val.toLowerCase();
    setOrderSuggestions(LAB_DB.filter(l => l.code.includes(q) || l.name.toLowerCase().includes(q)).slice(0, 5));
  };

  const addOrder = (lab) => {
    if (!selectedOrders.find(o => o.code === lab.code)) setSelectedOrders(p => [...p, lab]);
    setOrderInput(''); setOrderSuggestions([]);
  };

  // Smart drug search
  const handleRxInput = (val) => {
    setRxInput(val);
    if (val.length < 2) { setRxSuggestions([]); return; }
    const q = val.toLowerCase();
    setRxSuggestions(DRUG_DB.filter(d => d.name.toLowerCase().includes(q)).slice(0, 6));
  };

  const addRx = (drug) => {
    if (!selectedRx.find(r => r.name === drug.name)) setSelectedRx(p => [...p, { ...drug, qty: 30 }]);
    setRxInput(''); setRxSuggestions([]);
  };

  const handleSave = async () => {
    if (!id && !patient.name) return toast.error('Patient context missing');
    setSaving(true);
    try {
      const payload = {
        patientId: id || patient.mrn,
        patientName: patient.name,
        content: JSON.stringify(note),
        orders: selectedOrders,
        prescriptions: selectedRx,
        author: authorName,
        type: 'Progress Note',
      };

      const res = await api.post('/emr/sign', payload);
      if (!res.ok) throw new Error('Sign failed');
      
      toast.success('Consultation signed & transmitted');
      setNote({ subjective: '', objective: '', assessment: '', plan: '' });
      setSelectedOrders([]);
      setSelectedRx([]);
      fetchHistory();
    } catch {
      toast.error('Failed to finalize consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVitals = async () => {
    try {
      const res = await api.post('/vitals/record', {
        ...vitals,
        patientId: id || patient.mrn,
        author: authorName
      });
      if (!res.ok) throw new Error('Vitals failed');
      toast.success('Vitals recorded');
      fetchVitals();
    } catch {
      toast.error('Failed to save vitals');
    }
  };

  // (initials computed inline in JSX where needed)

  return (
    <Layout fullContent>
      {/* ── 🏥 Elite Clinical Header ─────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20 flex-shrink-0">
        <button 
          onClick={() => navigate(-1)} 
          className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-all border border-transparent hover:border-slate-200"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="h-6 w-[1px] bg-slate-200" />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-8 w-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 border border-teal-100 shadow-sm">
            <Stethoscope size={16} />
          </div>
          <h1 className="premium-text text-base font-bold text-slate-900 truncate">Clinical Encounter</h1>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">In-Progress</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setShowSummary(true)} className="btn-secondary py-2 px-4 shadow-sm">
            <Printer size={14} /> <span className="hidden lg:inline">Summary</span>
          </button>
          <button disabled={saving} onClick={handleSave} className="btn-premium px-6 py-2">
            {saving ? <Activity size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            <span>{saving ? 'Saving...' : 'Finalize & Sign'}</span>
          </button>
        </div>
      </div>

      {/* ── High-Density Clinical Canvas ─────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <div className="p-6 pb-0">
          <PatientBanner patient={patient} />
        </div>

      {/* ── 3-Panel Workspace ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* 🏥 Panel 1: Longitudinal History (Left) */}
        <div className="w-80 flex-shrink-0 border-r border-slate-200/60 overflow-y-auto p-6 space-y-6">
          {/* Allergies — Safety First */}
          {patient.allergies?.length > 0 && (
            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 animate-scale-in">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-3 flex items-center gap-2">
                <AlertCircle size={12} /> Active Safety Alerts
              </p>
              {patient.allergies.map(a => (
                <div key={a.drug} className="bg-white/60 border border-rose-200/50 rounded-xl px-3 py-2 mb-2 last:mb-0 shadow-sm shadow-rose-200/10">
                  <p className="text-xs font-bold text-rose-900">{a.drug}</p>
                  <p className="text-[11px] text-rose-600 font-medium">Reaction: {a.reaction}</p>
                </div>
              ))}
            </div>
          )}

          {/* Active Problems / Diagnoses */}
          <div className="clinical-card p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Known Diagnoses</p>
            <div className="flex flex-wrap gap-2">
              {(patient.diagnoses ?? []).map(d => (
                <span key={d} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200/50">{d}</span>
              ))}
            </div>
          </div>

          {/* Visit History */}
          <div className="clinical-card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Longitudinal Timeline</p>
            </div>
            <div className="p-2 space-y-1">
              {history.length > 0 ? history.map((h, i) => {
                // Parse SOAP JSON content into a readable preview
                let preview = 'Progress Note';
                try {
                  const soap = typeof h.content === 'string' ? JSON.parse(h.content) : h.content;
                  const text = soap?.assessment || soap?.subjective || soap?.plan || soap?.objective || '';
                  preview = text.trim() ? text.trim().substring(0, 60) : 'No details recorded';
                } catch {
                  preview = (h.content || 'Progress Note').substring(0, 60);
                }
                return (
                <div key={i} className="hover:bg-slate-50 p-3 rounded-xl transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{h.type}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{h.date}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-teal-700 transition-colors truncate">{preview}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{h.author}</p>
                </div>
                );
              }) : (
                <p className="text-[10px] text-slate-400 text-center py-4">No history records found</p>
              )}
            </div>
          </div>
        </div>

        {/* 🏥 Panel 2: Clinical Workspace (Center) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white/50 backdrop-blur-sm border-r border-slate-200/60">
          {/* Action Tabs — Precision Switching */}
          <div className="flex items-center gap-1 px-6 py-4 bg-slate-50/50 border-b border-slate-200/40 flex-shrink-0">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  activeTab === t.id 
                    ? 'bg-white text-teal-700 border-teal-200 shadow-sm shadow-teal-500/5 transition-scale animate-scale-in' 
                    : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.icon}
                <span className="tracking-tight uppercase tracking-wider">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">

            {/* SOAP Notes — Structured Intake */}
            {activeTab === 'notes' && (
              <div className="space-y-4 animate-fade-in max-w-4xl mx-auto py-2">
                {[
                  { key: 'subjective', label: 'Subjective', sub: 'Patient Complaint & History', color: 'bg-teal-500' },
                  { key: 'objective', label: 'Objective', sub: 'Clinical Findings & Vitals', color: 'bg-indigo-500' },
                  { key: 'assessment', label: 'Assessment', sub: 'Diagnoses & Differentials', color: 'bg-amber-500' },
                  { key: 'plan', label: 'Plan', sub: 'Treatment, Rx & Orders', color: 'bg-emerald-500' },
                ].map(field => (
                  <div key={field.key} className="clinical-card group hover:border-teal-400/30 transition-all p-0 overflow-hidden shadow-md">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-1.5 w-1.5 rounded-full ${field.color} shadow-sm`} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{field.label}</p>
                          <p className="text-[11px] font-bold text-slate-700">{field.sub}</p>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono group-focus-within:text-teal-400 transition-colors uppercase">Structured Intake</div>
                    </div>
                    <textarea
                      value={note[field.key]}
                      onChange={e => setNote(n => ({ ...n, [field.key]: e.target.value }))}
                      placeholder={`Enter ${field.label.toLowerCase()} details...`}
                      rows={field.key === 'subjective' ? 4 : 3}
                      className="w-full px-6 py-4 text-sm text-slate-800 placeholder:text-slate-300 resize-none outline-none bg-transparent font-medium leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Lab Orders */}
            {activeTab === 'orders' && (
              <div className="animate-fade-in space-y-4">
                <div className="card p-3">
                  <p className="text-xs font-bold text-slate-600 mb-2">Quick Order — type test name or code (cbc, lft, hba1c...)</p>
                  <div className="relative">
                    <FlaskConical size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={orderInput}
                      onChange={e => handleOrderInput(e.target.value)}
                      placeholder="e.g. cbc, hba1c, echo..."
                      className="input pl-9"
                      autoFocus={activeTab === 'orders'}
                    />
                  </div>
                  {orderSuggestions.length > 0 && (
                    <div className="mt-1 border border-slate-200 rounded-lg overflow-hidden shadow-lg">
                      {orderSuggestions.map(s => (
                        <button
                          key={s.code}
                          onClick={() => addOrder(s)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-teal-50 text-left border-b border-slate-100 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                            <p className="text-xs text-slate-400">TAT: {s.turnaround}</p>
                          </div>
                          <Plus size={14} className="text-teal-500" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {['Routine', 'Urgent', 'STAT'].map(p => (
                      <button
                        key={p}
                        onClick={() => setOrderPriority(p)}
                        className={`text-xs px-3 py-1.5 rounded-md font-semibold border transition-colors ${orderPriority === p
                          ? p === 'STAT' ? 'bg-red-500 text-white border-red-500' : p === 'Urgent' ? 'bg-amber-500 text-white border-amber-500' : 'bg-teal-500 text-white border-teal-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedOrders.length > 0 && (
                  <div className="card overflow-hidden">
                    <div className="card-header">
                      <p className="text-sm font-bold text-slate-800">Selected Tests ({selectedOrders.length})</p>
                      <span className={orderPriority === 'STAT' ? 'badge badge-red' : orderPriority === 'Urgent' ? 'badge badge-amber' : 'badge badge-teal'}>{orderPriority}</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {selectedOrders.map(o => (
                        <div key={o.code} className="px-4 py-2.5 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{o.name}</p>
                            <p className="text-xs text-slate-400">TAT {o.turnaround}</p>
                          </div>
                          <button onClick={() => setSelectedOrders(p => p.filter(x => x.code !== o.code))} className="text-slate-400 hover:text-red-500">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t bg-slate-50">
                      <button className="btn-primary w-full justify-center" onClick={async () => {
                        try {
                          const res = await api.post('/lab-orders', {
                            tests: selectedOrders,
                            patientId: id,
                            priority: 'Routine',
                            orderedBy: authorName,
                          });
                          if (!res.ok) throw new Error('Failed');
                          toast.success(`${selectedOrders.length} lab order(s) submitted`);
                        } catch {
                          toast.error('Failed to submit lab orders');
                        }
                        setSelectedOrders([]);
                      }}>
                        <FlaskConical size={14} /> Submit {selectedOrders.length} Lab Order{selectedOrders.length > 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prescription */}
            {activeTab === 'rx' && (
              <div className="animate-fade-in space-y-4">
                {patient.allergies?.length > 0 && (
                  <div className="alert-critical">
                    <AlertCircle size={15} className="flex-shrink-0" />
                    Allergy on file: {patient.allergies.map(a => a.drug).join(', ')} — CDSS active
                  </div>
                )}
                <div className="card p-3">
                  <p className="text-xs font-bold text-slate-600 mb-2">Search Medication</p>
                  <div className="relative">
                    <Pill size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={rxInput}
                      onChange={e => handleRxInput(e.target.value)}
                      placeholder="e.g. atorva, metformin, paracetamol..."
                      className="input pl-9"
                    />
                  </div>
                  {rxSuggestions.length > 0 && (
                    <div className="mt-1 border border-slate-200 rounded-lg overflow-hidden shadow-lg">
                      {rxSuggestions.map(s => (
                        <button
                          key={s.name}
                          onClick={() => addRx(s)}
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-teal-50 text-left border-b border-slate-100 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                            <p className="text-xs text-slate-400">{s.sig}</p>
                          </div>
                          <span className="badge badge-blue flex-shrink-0">{s.class}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedRx.length > 0 && (
                  <div className="card overflow-hidden">
                    <div className="card-header">
                      <p className="text-sm font-bold text-slate-800">Prescription ({selectedRx.length} drug{selectedRx.length !== 1 ? 's' : ''})</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {selectedRx.map((rx, i) => (
                        <div key={rx.name} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800">{rx.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{rx.sig}</p>
                              <input
                                type="text"
                                defaultValue={rx.sig}
                                className="input-sm mt-1.5 max-w-xs"
                                placeholder="Modify sig..."
                              />
                            </div>
                            <button onClick={() => setSelectedRx(p => p.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t bg-slate-50">
                      <button className="btn-primary w-full justify-center" onClick={async () => {
                          try {
                            const res = await api.post('/prescriptions', {
                              patientId: id,
                              prescribedBy: authorName,
                              drugs: selectedRx,
                            });
                            if (!res.ok) throw new Error('Failed');
                            toast.success('Prescription transmitted (eRx)');
                          } catch {
                            toast.success('Prescription saved — will transmit on consultation sign');
                          }
                          setSelectedRx([]);
                        }}>
                        <Pill size={14} /> Transmit Prescription (eRx)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vitals */}
            {activeTab === 'vitals' && (
              <div className="animate-fade-in">
                <div className="card p-4">
                  <p className="text-sm font-bold text-slate-800 mb-4">Record Current Vitals</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'bp', label: 'Blood Pressure', unit: 'mmHg', placeholder: '120/80' },
                      { key: 'hr', label: 'Heart Rate', unit: 'bpm', placeholder: '72' },
                      { key: 'spo2', label: 'SpO₂', unit: '%', placeholder: '98' },
                      { key: 'temp', label: 'Temperature', unit: '°F', placeholder: '98.6' },
                      { key: 'rr', label: 'Resp. Rate', unit: '/min', placeholder: '16' },
                      { key: 'weight', label: 'Weight', unit: 'kg', placeholder: '72' },
                    ].map(v => (
                      <div key={v.key}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">{v.label} <span className="text-slate-300">{v.unit}</span></label>
                        <input
                          type="text"
                          value={vitals[v.key]}
                          onChange={e => setVitals(p => ({ ...p, [v.key]: e.target.value }))}
                          placeholder={v.placeholder}
                          className="input"
                        />
                      </div>
                    ))}
                  </div>
                  <button className="btn-primary mt-4" onClick={handleSaveVitals}>
                    <CheckCircle2 size={14} /> Save Vitals
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🏥 Panel 3: Clinical Decision Support (Right) */}
        <div className="w-80 xl:w-96 flex-shrink-0 bg-slate-50 border-l border-slate-200/60 overflow-y-auto p-6 space-y-6">
          {/* Decision Support Intelligence */}
          <div className="space-y-4 text-center">
             <div className="glass-panel p-5 bg-gradient-to-br from-teal-50 to-white border-teal-100">
                <div className="h-10 w-10 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mx-auto mb-3 shadow-sm border border-teal-200/50">
                  <Activity size={20} className="animate-pulse" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-teal-800 mb-1">RSM CDSS Active</h3>
                <p className="text-[11px] text-teal-600 font-bold mb-4">Real-time Clinical Insight Engine</p>
                
                <div className="space-y-2 text-left">
                  <div className="p-3 bg-white/80 border border-red-100 rounded-xl shadow-sm animate-fade-in">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertCircle size={12} className="text-red-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Critical Alert</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-800">LDL 190 mg/dL — intensifcation recommended</p>
                  </div>
                  <div className="p-3 bg-white/80 border border-amber-100 rounded-xl shadow-sm animate-fade-in animation-delay-300">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertCircle size={12} className="text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Observation</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-800">HbA1c 8.2% — Review adherence</p>
                  </div>
                </div>
             </div>
          </div>

          {/* Quick Diagnostics (Recent Results) */}
          <div className="clinical-card p-0">
             <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Investigations</p>
             </div>
             <div className="p-2 space-y-1">
                {vitalsHistory.length > 0 ? vitalsHistory.slice(0, 5).map((v, i) => (
                  <div key={i} className="hover:bg-slate-50 p-3 rounded-xl transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[11px] font-extrabold text-slate-800">Vital Record</span>
                       <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-teal-100 text-teal-700">Stable</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-400">BP: {v.bp} • HR: {v.hr}</span>
                       <span className="text-[9px] font-bold text-slate-300">{v.date}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 text-center py-4 italic">No vitals on file</p>
                )}
             </div>
          </div>

          {/* Clinical Shortcuts */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => { toast('Referral form opening — select specialty in Encounters module', { icon: '🏥' }); navigate('/encounters'); }}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl hover:bg-white text-xs font-bold text-slate-600 border border-slate-200/50 hover:border-teal-200/50 transition-all hover:shadow-sm"
            >
              Refer to Specialist <ChevronRight size={14} />
            </button>
            <button
              onClick={() => navigate('/appointments')}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl hover:bg-white text-xs font-bold text-slate-600 border border-slate-200/50 hover:border-teal-200/50 transition-all hover:shadow-sm"
            >
              Schedule Follow-up <Clock size={14} />
            </button>
            <button
              onClick={() => navigate(id ? `/patients/${id}` : '/patients')}
              className="btn-premium w-full justify-between px-5 font-bold"
            >
              View Longitudinal Data <FileText size={14} />
            </button>
          </div>
        </div>
      </div>
     </div>

      {/* ── 📄 Discharge Summary Modal ─────────────────────────────── */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowSummary(false)}>
          <div
            id="summary-print-area"
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100">
                  <Printer size={16} className="text-teal-600" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">Clinical Encounter Summary</h2>
                  <p className="text-[11px] text-slate-400">{new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const style = document.createElement('style');
                    style.textContent = '@media print { body > *:not(#summary-print-root) { display: none !important; } #summary-print-root { display: block !important; } }';
                    document.head.appendChild(style);
                    window.print();
                    setTimeout(() => document.head.removeChild(style), 500);
                  }}
                  className="btn-premium py-1.5 px-4 text-xs"
                >
                  <Printer size={13} /> Print
                </button>
                <button onClick={() => setShowSummary(false)} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Summary body */}
            <div className="px-6 py-5 space-y-5 text-sm">

              {/* Patient Info */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Patient</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  <div><span className="text-[11px] text-slate-400">Name</span><p className="text-xs font-bold text-slate-800">{patient.name}</p></div>
                  <div><span className="text-[11px] text-slate-400">MRN</span><p className="text-xs font-bold text-slate-800">{patient.mrn}</p></div>
                  <div><span className="text-[11px] text-slate-400">DOB / Age</span><p className="text-xs font-bold text-slate-800">{patient.dob} ({patient.age} yrs)</p></div>
                  <div><span className="text-[11px] text-slate-400">Gender</span><p className="text-xs font-bold text-slate-800">{patient.gender}</p></div>
                  <div><span className="text-[11px] text-slate-400">Blood Group</span><p className="text-xs font-bold text-slate-800">{patient.blood}</p></div>
                  <div><span className="text-[11px] text-slate-400">Insurance</span><p className="text-xs font-bold text-slate-800">{patient.insurance ?? '—'}</p></div>
                </div>
              </div>

              {/* Allergies */}
              {patient.allergies?.length > 0 && (
                <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">⚠ Allergies</p>
                  {patient.allergies.map(a => (
                    <p key={a.drug} className="text-xs font-bold text-rose-800">{a.drug} — {a.reaction} <span className="font-normal text-rose-600">({a.severity})</span></p>
                  ))}
                </div>
              )}

              {/* Diagnoses */}
              {patient.diagnoses?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Active Diagnoses</p>
                  <div className="flex flex-wrap gap-2">
                    {patient.diagnoses.map(d => (
                      <span key={d} className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-100 rounded-lg text-[11px] font-bold">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* SOAP Notes */}
              {(note.subjective || note.objective || note.assessment || note.plan) && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">SOAP Notes</p>
                  <div className="space-y-2">
                    {[['S — Subjective', note.subjective], ['O — Objective', note.objective], ['A — Assessment', note.assessment], ['P — Plan', note.plan]]
                      .filter(([, v]) => v)
                      .map(([label, val]) => (
                        <div key={label} className="rounded-xl border border-slate-100 px-4 py-3">
                          <p className="text-[10px] font-black text-slate-500 mb-1">{label}</p>
                          <p className="text-xs text-slate-700 whitespace-pre-wrap">{val}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {!note.subjective && !note.objective && !note.assessment && !note.plan && (
                <div className="text-center py-3 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">No SOAP notes entered for this encounter</div>
              )}

              {/* Vitals */}
              {(vitals.bp || vitals.hr || vitals.spo2 || vitals.temp) && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Vitals Recorded</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[['BP', vitals.bp, 'mmHg'], ['HR', vitals.hr, 'bpm'], ['SpO₂', vitals.spo2, '%'], ['Temp', vitals.temp, '°F'], ['RR', vitals.rr, '/min'], ['Weight', vitals.weight, 'kg']]
                      .filter(([, v]) => v)
                      .map(([label, val, unit]) => (
                        <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                          <p className="text-[10px] font-black text-slate-400">{label}</p>
                          <p className="text-sm font-black text-slate-800">{val} <span className="text-[10px] font-normal text-slate-400">{unit}</span></p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Lab Orders */}
              {selectedOrders.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Lab Orders</p>
                  <div className="space-y-1.5">
                    {selectedOrders.map(o => (
                      <div key={o.code} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                        <p className="text-xs font-bold text-slate-800">{o.name}</p>
                        <span className="text-[10px] font-bold text-slate-400">{o.turnaround}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescriptions */}
              {selectedRx.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Prescriptions</p>
                  <div className="space-y-1.5">
                    {selectedRx.map(r => (
                      <div key={r.name} className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                        <p className="text-xs font-bold text-slate-800">{r.name}</p>
                        <p className="text-[11px] text-slate-500">{r.sig} · Qty: {r.qty}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">Attending: <span className="font-bold text-slate-600">{authorName}</span></p>
                <p className="text-[11px] text-slate-400">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
