/* =====================================================================
   Lumina Health — shared by the website app (app.html) AND the mobile app:
   medicine list, formatting helpers, and the printable prescription /
   receipt layouts. Edit here once; both apps update.
   ===================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.LuminaShared = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------------- medicine database (dummy, for suggestions) ----------------
     Form|Brand|Composition|Dosage M-A-N|When|Frequency|Duration n|unit|Notes */
  var MEDS_RAW = [
    // dermatology first (Skin Shine), then general medicines
    "Cap.|Doxt-SL 100|Doxycycline 100 mg|0-0-1|After food|Daily|6|Weeks|Do not lie down for 30 min after the tablet",
    "Cap.|Isotroin 20|Isotretinoin 20 mg|0-0-1|After food|Daily|1|Months|With dinner. Avoid pregnancy; monthly LFT and lipids",
    "Cap.|Isotroin 10|Isotretinoin 10 mg|0-0-1|After food|Daily|1|Months|With dinner. Avoid pregnancy; monthly LFT and lipids",
    "Tab.|Minoz 50|Minocycline 50 mg|0-0-1|After food|Daily|6|Weeks",
    "Gel|Adaferin|Adapalene 0.1%|0-0-1|Apply locally|Daily|2|Months|Pea-sized amount on whole face at night",
    "Gel|Clindac A|Clindamycin 1%|1-0-0|Apply locally|Daily|6|Weeks|On pimples only",
    "Gel|Deriva CMS|Adapalene 0.1% + Clindamycin 1%|0-0-1|Apply locally|Daily|2|Months",
    "Gel|Benzac AC 2.5%|Benzoyl peroxide 2.5%|0-0-1|Apply locally|Daily|1|Months|May bleach clothes and pillow covers",
    "Cream|Retino-A 0.025%|Tretinoin 0.025%|0-0-1|Apply locally|Daily|2|Months|Avoid sun; use sunscreen in the day",
    "Gel|Aziderm 20%|Azelaic acid 20%|1-0-1|Apply locally|Daily|2|Months",
    "Face wash|Saslic DS|Salicylic acid 2% face wash|1-0-1|Apply locally|Daily|2|Months",
    "Lotion|Suncros SPF 50|Sunscreen SPF 50|1-1-0|Apply locally|Daily|3|Months|Reapply every 3 hours outdoors",
    "Cream|Melalite Forte|Hydroquinone 2% + Tretinoin + Mometasone|0-0-1|Apply locally|Daily|4|Weeks|Only on dark patches; not more than 8 weeks",
    "Cream|Kojivit|Kojic acid + Arbutin + Vitamin C|0-0-1|Apply locally|Daily|2|Months",
    "Tab.|Tranexa 500|Tranexamic acid 500 mg|1-0-1|After food|Daily|2|Months|For melasma",
    "Solution|Mintop 5%|Minoxidil 5%|0-0-1|Apply locally|Daily|3|Months|1 ml on dry scalp, do not wash for 4 hours",
    "Solution|Mintop 2%|Minoxidil 2%|0-0-1|Apply locally|Daily|3|Months|1 ml on dry scalp",
    "Tab.|Finax 1|Finasteride 1 mg|1-0-0|After food|Daily|3|Months",
    "Tab.|Follihair|Biotin + multivitamins|1-0-0|After food|Daily|3|Months",
    "Tab.|Biotin 10 mg|Biotin 10 mg|1-0-0|After food|Daily|3|Months",
    "Shampoo|Nizral|Ketoconazole 2%|1-0-0|Apply locally|Twice a week|4|Weeks|Leave on scalp for 5 minutes before washing",
    "Shampoo|Scalpe Plus|Ketoconazole + Zinc pyrithione|1-0-0|Apply locally|Twice a week|1|Months",
    "Cap.|Itaspor 200|Itraconazole 200 mg|1-0-0|After food|Daily|3|Weeks",
    "Cap.|Itaspor 100|Itraconazole 100 mg|1-0-1|After food|Daily|3|Weeks",
    "Tab.|Terbicip 250|Terbinafine 250 mg|1-0-0|After food|Daily|4|Weeks",
    "Cream|Lulifin|Luliconazole 1%|1-0-1|Apply locally|Daily|4|Weeks|Apply 2 cm beyond the patch",
    "Lacquer|Loceryl|Amorolfine 5% nail lacquer|1-0-0|Apply locally|Weekly|6|Months|On affected nails",
    "Cream|Momate|Mometasone 0.1%|0-0-1|Apply locally|Daily|2|Weeks|Thin layer; not on face",
    "Ointment|Tacroz Forte|Tacrolimus 0.1%|1-0-1|Apply locally|Daily|4|Weeks",
    "Cream|Fucidin|Fusidic acid 2%|1-0-1|Apply locally|Daily|7|Days",
    "Cream|Permite|Permethrin 5%|0-0-1|Apply locally|Once|1|Days|Neck down at night, wash after 8-12 hours; repeat after 1 week",
    "Tab.|Ivermectol 12|Ivermectin 12 mg|1-0-0|Empty stomach|Once|1|Days|Repeat after 1 week",
    "Tab.|Atarax 10|Hydroxyzine 10 mg|0-0-1|After food|SOS|7|Days|May cause drowsiness",
    "Tab.|Atarax 25|Hydroxyzine 25 mg|0-0-1|After food|SOS|7|Days|May cause drowsiness",
    "Tab.|Bilaxten 20|Bilastine 20 mg|1-0-0|Empty stomach|Daily|10|Days",
    "Syp.|Levocet|Levocetirizine 2.5 mg/5 ml|0-0-5ml|After food|Daily|7|Days",
    "Lotion|Cetaphil Moisturising|Moisturising lotion|1-1-1|Apply locally|Daily|1|Months|After every bath and hand wash",
    "Lotion|Calamine|Calamine lotion|1-0-1|Apply locally|SOS|7|Days",
    "Tab.|Methotrexate 7.5|Methotrexate 7.5 mg|1-0-0|After food|Weekly|4|Weeks|Once a week only, same day each week",
    "Solution|Duofilm|Salicylic acid + Lactic acid|0-0-1|Apply locally|Daily|4|Weeks|Only on warts",
    "Tab.|Dolo 650|Paracetamol 650 mg|1-0-1|After food|Daily|3|Days",
    "Tab.|Dolo 500|Paracetamol 500 mg|1-0-1|After food|Daily|3|Days",
    "Syp.|Dolo 250 Suspension|Paracetamol 250 mg/5 ml|5ml-5ml-5ml|After food|SOS|3|Days|Only if fever above 100 F",
    "Tab.|Dolo 1000|Paracetamol 1000 mg|1-0-0|After food|SOS|3|Days",
    "Tab.|Calpol 650|Paracetamol 650 mg|1-0-1|After food|Daily|3|Days",
    "Tab.|Calpol 500|Paracetamol 500 mg|1-0-1|After food|Daily|3|Days",
    "Syp.|Calpol 250|Paracetamol 250 mg/5 ml|5ml-5ml-5ml|After food|SOS|3|Days",
    "Tab.|Crocin Advance|Paracetamol 500 mg|1-0-1|After food|Daily|3|Days",
    "Tab.|Crocin 650|Paracetamol 650 mg|1-0-1|After food|Daily|3|Days",
    "Tab.|Combiflam|Ibuprofen 400 mg + Paracetamol 325 mg|1-0-1|After food|Daily|3|Days",
    "Tab.|Brufen 400|Ibuprofen 400 mg|1-0-1|After food|Daily|3|Days",
    "Tab.|Zerodol SP|Aceclofenac 100 mg + Paracetamol 325 mg + Serratiopeptidase 15 mg|1-0-1|After food|Daily|5|Days",
    "Tab.|Zerodol P|Aceclofenac 100 mg + Paracetamol 325 mg|1-0-1|After food|Daily|5|Days",
    "Tab.|Ultracet|Tramadol 37.5 mg + Paracetamol 325 mg|1-0-1|After food|SOS|3|Days",
    "Tab.|Meftal Spas|Mefenamic acid 250 mg + Dicyclomine 10 mg|1-0-1|After food|SOS|3|Days",
    "Tab.|Cyclopam|Dicyclomine 20 mg + Paracetamol 500 mg|1-0-1|After food|SOS|3|Days",
    "Tab.|Voveran SR 100|Diclofenac 100 mg|1-0-0|After food|Daily|5|Days",
    "Tab.|Pan 40|Pantoprazole 40 mg|1-0-0|Before breakfast|Daily|14|Days",
    "Cap.|Pan D|Pantoprazole 40 mg + Domperidone 30 mg|1-0-0|Before breakfast|Daily|14|Days",
    "Tab.|Pantocid 40|Pantoprazole 40 mg|1-0-0|Before breakfast|Daily|14|Days",
    "Cap.|Omez 20|Omeprazole 20 mg|1-0-0|Before breakfast|Daily|14|Days",
    "Tab.|Razo 20|Rabeprazole 20 mg|1-0-0|Before breakfast|Daily|14|Days",
    "Cap.|Razo D|Rabeprazole 20 mg + Domperidone 30 mg|1-0-0|Before breakfast|Daily|14|Days",
    "Tab.|Famocid 20|Famotidine 20 mg|1-0-1|Before food|Daily|7|Days",
    "Syp.|Digene|Magnesium hydroxide + Aluminium hydroxide + Simethicone|10ml-10ml-10ml|After food|SOS|7|Days",
    "Tab.|Ondem 4|Ondansetron 4 mg|1-0-1|Before food|SOS|3|Days",
    "Tab.|Emeset 4|Ondansetron 4 mg|1-0-1|Before food|SOS|3|Days",
    "Tab.|Domstal 10|Domperidone 10 mg|1-0-1|Before food|Daily|5|Days",
    "Tab.|Azithral 500|Azithromycin 500 mg|1-0-0|After food|Daily|3|Days",
    "Tab.|Azee 500|Azithromycin 500 mg|1-0-0|After food|Daily|3|Days",
    "Syp.|Azithral 200 Liquid|Azithromycin 200 mg/5 ml|5ml-0-0|After food|Daily|3|Days",
    "Tab.|Augmentin 625 Duo|Amoxicillin 500 mg + Clavulanic acid 125 mg|1-0-1|After food|Daily|5|Days",
    "Cap.|Mox 500|Amoxicillin 500 mg|1-1-1|After food|Daily|5|Days",
    "Tab.|Taxim-O 200|Cefixime 200 mg|1-0-1|After food|Daily|5|Days",
    "Tab.|Zifi 200|Cefixime 200 mg|1-0-1|After food|Daily|5|Days",
    "Tab.|Cifran 500|Ciprofloxacin 500 mg|1-0-1|After food|Daily|5|Days",
    "Tab.|Levoflox 500|Levofloxacin 500 mg|1-0-0|After food|Daily|5|Days",
    "Tab.|Norflox TZ|Norfloxacin 400 mg + Tinidazole 600 mg|1-0-1|After food|Daily|3|Days",
    "Tab.|Metrogyl 400|Metronidazole 400 mg|1-1-1|After food|Daily|5|Days",
    "Cap.|Doxy 1 LDR Forte|Doxycycline 100 mg + Lactic acid bacillus|1-0-1|After food|Daily|5|Days",
    "Tab.|Forcan 150|Fluconazole 150 mg|1-0-0|After food|Weekly|2|Weeks",
    "Tab.|Cetzine 10|Cetirizine 10 mg|0-0-1|After food|Daily|5|Days",
    "Tab.|Levocet 5|Levocetirizine 5 mg|0-0-1|After food|Daily|5|Days",
    "Tab.|Allegra 120|Fexofenadine 120 mg|1-0-0|After food|Daily|5|Days",
    "Tab.|Allegra 180|Fexofenadine 180 mg|1-0-0|After food|Daily|5|Days",
    "Tab.|Montair LC|Montelukast 10 mg + Levocetirizine 5 mg|0-0-1|After food|Daily|10|Days",
    "Tab.|Sinarest|Paracetamol + Phenylephrine + Chlorpheniramine|1-0-1|After food|Daily|3|Days",
    "Syp.|Ascoril LS|Ambroxol + Levosalbutamol + Guaifenesin|5ml-5ml-5ml|After food|Daily|5|Days",
    "Syp.|Ascoril D Junior|Dextromethorphan + Chlorpheniramine|2.5ml-0-2.5ml|After food|Daily|5|Days",
    "Syp.|Grilinctus|Dextromethorphan + Chlorpheniramine|5ml-5ml-5ml|After food|Daily|5|Days",
    "Syp.|Benadryl|Diphenhydramine + Ammonium chloride|5ml-5ml-5ml|After food|Daily|5|Days",
    "Inh.|Asthalin|Salbutamol 100 mcg|1-0-1|After food|SOS|1|Months|2 puffs when breathless",
    "Inh.|Foracort 200|Formoterol 6 mcg + Budesonide 200 mcg|1-0-1|After food|Daily|1|Months|2 puffs; rinse mouth after use",
    "Tab.|Deriphyllin Retard 150|Etofylline + Theophylline|1-0-1|After food|Daily|7|Days",
    "Tab.|Glycomet 500|Metformin 500 mg|1-0-1|After food|Daily|1|Months",
    "Tab.|Glycomet 500 SR|Metformin SR 500 mg|1-0-1|After food|Daily|1|Months",
    "Tab.|Glycomet 850|Metformin 850 mg|1-0-1|After food|Daily|1|Months",
    "Tab.|Glycomet 1 g SR|Metformin SR 1000 mg|1-0-1|After food|Daily|1|Months",
    "Tab.|Glycomet GP 1|Metformin 500 mg + Glimepiride 1 mg|1-0-0|Before breakfast|Daily|1|Months",
    "Tab.|Glycomet GP 2|Metformin 500 mg + Glimepiride 2 mg|1-0-0|Before breakfast|Daily|1|Months",
    "Tab.|Glycomet GP 1 Forte|Metformin 1000 mg + Glimepiride 1 mg|1-0-1|Before food|Daily|1|Months",
    "Tab.|Amaryl 1|Glimepiride 1 mg|1-0-0|Before breakfast|Daily|1|Months",
    "Tab.|Amaryl 2|Glimepiride 2 mg|1-0-0|Before breakfast|Daily|1|Months",
    "Tab.|Januvia 100|Sitagliptin 100 mg|1-0-0|After breakfast|Daily|1|Months",
    "Tab.|Janumet 50/500|Sitagliptin 50 mg + Metformin 500 mg|1-0-1|After food|Daily|1|Months",
    "Tab.|Galvus Met 50/500|Vildagliptin 50 mg + Metformin 500 mg|1-0-1|After food|Daily|1|Months",
    "Tab.|Istamet 50/500|Sitagliptin 50 mg + Metformin 500 mg|1-0-1|After food|Daily|1|Months",
    "Tab.|Jardiance 10|Empagliflozin 10 mg|1-0-0|After breakfast|Daily|1|Months",
    "Tab.|Forxiga 10|Dapagliflozin 10 mg|1-0-0|After breakfast|Daily|1|Months",
    "Inj.|Lantus|Insulin glargine 100 IU/ml|0-0-1|Bed time|Daily|1|Months|Units as advised",
    "Inj.|Huminsulin 30/70|Human insulin premix 30/70|1-0-1|Before food|Daily|1|Months|Units as advised, 15 min before meal",
    "Tab.|Telma 40|Telmisartan 40 mg|1-0-0|After food|Daily|1|Months",
    "Tab.|Telma 80|Telmisartan 80 mg|1-0-0|After food|Daily|1|Months",
    "Tab.|Telma H|Telmisartan 40 mg + Hydrochlorothiazide 12.5 mg|1-0-0|After food|Daily|1|Months",
    "Tab.|Telma AM|Telmisartan 40 mg + Amlodipine 5 mg|1-0-0|After food|Daily|1|Months",
    "Tab.|Amlong 5|Amlodipine 5 mg|1-0-0|After food|Daily|1|Months",
    "Tab.|Stamlo 5|Amlodipine 5 mg|1-0-0|After food|Daily|1|Months",
    "Tab.|Concor 5|Bisoprolol 5 mg|1-0-0|After food|Daily|1|Months",
    "Tab.|Met XL 25|Metoprolol succinate 25 mg|1-0-0|After food|Daily|1|Months",
    "Tab.|Met XL 50|Metoprolol succinate 50 mg|1-0-0|After food|Daily|1|Months",
    "Tab.|Losar 50|Losartan 50 mg|1-0-0|After food|Daily|1|Months",
    "Tab.|Ecosprin 75|Aspirin 75 mg|0-1-0|After food|Daily|1|Months",
    "Tab.|Ecosprin AV 75|Aspirin 75 mg + Atorvastatin 10 mg|0-0-1|After food|Daily|1|Months",
    "Tab.|Clopilet 75|Clopidogrel 75 mg|0-1-0|After food|Daily|1|Months",
    "Tab.|Atorva 10|Atorvastatin 10 mg|0-0-1|Bed time|Daily|1|Months",
    "Tab.|Atorva 20|Atorvastatin 20 mg|0-0-1|Bed time|Daily|1|Months",
    "Tab.|Rosuvas 10|Rosuvastatin 10 mg|0-0-1|Bed time|Daily|1|Months",
    "Tab.|Rosuvas 20|Rosuvastatin 20 mg|0-0-1|Bed time|Daily|1|Months",
    "Tab.|Lasix 40|Furosemide 40 mg|1-0-0|After breakfast|Daily|7|Days",
    "Tab.|Dytor 10|Torsemide 10 mg|1-0-0|After breakfast|Daily|7|Days",
    "Tab.|Thyronorm 25|Levothyroxine 25 mcg|1-0-0|Empty stomach|Daily|3|Months|30 min before breakfast",
    "Tab.|Thyronorm 50|Levothyroxine 50 mcg|1-0-0|Empty stomach|Daily|3|Months|30 min before breakfast",
    "Tab.|Thyronorm 75|Levothyroxine 75 mcg|1-0-0|Empty stomach|Daily|3|Months|30 min before breakfast",
    "Tab.|Thyronorm 100|Levothyroxine 100 mcg|1-0-0|Empty stomach|Daily|3|Months|30 min before breakfast",
    "Tab.|Eltroxin 50|Levothyroxine 50 mcg|1-0-0|Empty stomach|Daily|3|Months|30 min before breakfast",
    "Tab.|Neomercazole 5|Carbimazole 5 mg|1-0-1|After food|Daily|1|Months",
    "Tab.|Shelcal 500|Calcium carbonate 1250 mg + Vitamin D3 250 IU|0-1-0|After food|Daily|1|Months",
    "Tab.|Shelcal HD|Calcium carbonate 1250 mg + Vitamin D3 1000 IU|0-1-0|After food|Daily|1|Months",
    "Cap.|Uprise D3 60K|Cholecalciferol 60000 IU|1-0-0|With milk|Weekly|8|Weeks",
    "Cap.|D-Rise 60K|Cholecalciferol 60000 IU|1-0-0|With milk|Weekly|8|Weeks",
    "Cap.|Becosules|Vitamin B-complex + Vitamin C|1-0-0|After food|Daily|1|Months",
    "Tab.|Neurobion Forte|Vitamin B1 + B6 + B12|1-0-0|After food|Daily|1|Months",
    "Tab.|Nurokind OD|Methylcobalamin 1500 mcg|1-0-0|After food|Daily|1|Months",
    "Tab.|Limcee 500|Vitamin C 500 mg|1-0-0|After food|Daily|1|Months",
    "Tab.|Zincovit|Multivitamin + Multimineral + Zinc|1-0-0|After food|Daily|1|Months",
    "Tab.|Folvite 5|Folic acid 5 mg|1-0-0|After food|Daily|1|Months",
    "Tab.|Orofer XT|Ferrous ascorbate 100 mg + Folic acid 1.5 mg|0-0-1|After food|Daily|1|Months",
    "Sach.|Electral|Oral rehydration salts (WHO)|1-1-1|After food|Daily|3|Days|1 sachet in 1 litre water, sip through the day",
    "Cap.|Sporlac|Lactic acid bacillus|1-0-1|After food|Daily|5|Days",
    "Syp.|Duphalac|Lactulose 10 g/15 ml|0-0-15ml|Bed time|Daily|7|Days",
    "Syp.|Cremaffin Plus|Liquid paraffin + Milk of magnesia + Sodium picosulfate|0-0-10ml|Bed time|Daily|7|Days",
    "Tab.|Udiliv 300|Ursodeoxycholic acid 300 mg|1-0-1|After food|Daily|1|Months",
    "Tab.|Liv 52|Herbal liver formulation|1-0-1|After food|Daily|1|Months",
    "Cap.|Pregalin 75|Pregabalin 75 mg|0-0-1|Bed time|Daily|1|Months",
    "Tab.|Gabapin 300|Gabapentin 300 mg|0-0-1|Bed time|Daily|1|Months",
    "Tab.|Nexito 10|Escitalopram 10 mg|0-0-1|After food|Daily|1|Months",
    "Tab.|Melatonin 3 mg|Melatonin 3 mg|0-0-1|Bed time|Daily|1|Months",
    "Tab.|Susten 200|Natural micronised progesterone 200 mg|0-0-1|Bed time|Daily|1|Months",
    "Tab.|Duphaston 10|Dydrogesterone 10 mg|1-0-1|After food|Daily|10|Days",
    "Tab.|Meprate 10|Medroxyprogesterone 10 mg|1-0-1|After food|Daily|10|Days",
    "Oint.|Soframycin|Framycetin 1%|1-0-1|Apply locally|Daily|5|Days",
    "Cream|Candid|Clotrimazole 1%|1-0-1|Apply locally|Daily|2|Weeks",
    "Gel|Volini|Diclofenac + Methyl salicylate + Menthol|1-0-1|Apply locally|Daily|5|Days",
    "Oint.|T-Bact|Mupirocin 2%|1-0-1|Apply locally|Daily|5|Days",
    "Drops|Moxicip Eye Drops|Moxifloxacin 0.5%|1-1-1|Apply locally|Daily|5|Days|1 drop in each eye",
  ];
  var MEDS = MEDS_RAW.map(function (l) {
    var p = l.split("|");
    return { form: p[0], brand: p[1], name: p[0] + " " + p[1], comp: p[2], dose: p[3], when: p[4], freq: p[5], durN: p[6], durU: p[7], notes: p[8] || "" };
  });
  var QUICK = ["Doxt-SL 100", "Adaferin", "Clindac A", "Suncros SPF 50", "Saslic DS", "Mintop 5%", "Follihair", "Itaspor 200", "Lulifin", "Levocet 5", "Atarax 10", "Momate"];
  var DOSE_OPTS = ["0", "½", "1", "1½", "2", "2.5ml", "5ml", "10ml", "15ml"];
  var WHEN_OPTS = ["After food", "Before food", "Before breakfast", "After breakfast", "Empty stomach", "Bed time", "With milk", "Apply locally"];
  var FREQ_OPTS = ["Daily", "Alternate days", "Twice a week", "Weekly", "Monthly", "SOS", "Once"];
  var DIAGNOSES = ["Acne vulgaris", "Post-inflammatory hyperpigmentation", "Melasma", "Androgenetic alopecia", "Female pattern hair loss", "Telogen effluvium", "Alopecia areata", "Seborrhoeic dermatitis", "Tinea corporis", "Tinea cruris", "Onychomycosis", "Ingrown toenail", "Scabies", "Eczema / dermatitis", "Psoriasis", "Urticaria", "Vitiligo", "Common warts", "Molluscum contagiosum", "Contact dermatitis", "Pityriasis versicolor", "Rosacea"];
  var RECEIPT_ITEMS = [["Consultation", 500], ["Review visit", 300], ["Chemical peel", 2500], ["PRP therapy for hair", 4000], ["Wart removal (RF cautery)", 1500], ["Nail surgery", 3000], ["Acne scar microneedling", 3500], ["Laser hair reduction session", 2500], ["Skin biopsy", 1500], ["Hair transplant consultation", 1000]];

  // Same match quality -> database order (most commonly used strengths are listed first)
  function searchMeds(q, limit) {
    q = String(q || "").trim().toLowerCase(); if (!q) return [];
    var scored = [];
    MEDS.forEach(function (m, i) {
      var b = m.brand.toLowerCase(), n = m.name.toLowerCase(), c = m.comp.toLowerCase(), s = -1;
      if (b.indexOf(q) === 0) s = 0;
      else if (b.split(/[\s-]/).some(function (w) { return w.indexOf(q) === 0; })) s = 1;
      else if (n.indexOf(q) >= 0) s = 2;
      else if (c.indexOf(q) >= 0) s = 3;
      if (s >= 0) scored.push([s, i, m]);
    });
    return scored.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }).slice(0, limit || 9).map(function (x) { return x[2]; });
  }

  /* ---------------- formatting ---------------- */
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function todayStr() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function fmtDate(d) { if (!d) return "—"; var p = String(d).slice(0, 10).split("-"); return (+p[2]) + " " + MONTHS[+p[1] - 1] + " " + p[0]; }
  function fmtTime(t) { if (!t) return ""; var p = String(t).split(":"), h = +p[0]; return (h % 12 || 12) + ":" + p[1] + (h < 12 ? " AM" : " PM"); }
  function money(n) { n = Math.round(Number(n || 0) * 100) / 100; var s = String(Math.floor(n)), last3 = s.slice(-3), rest = s.slice(0, -3); if (rest) last3 = "," + last3; var dec = n % 1 ? (n % 1).toFixed(2).slice(1) : ""; return "₹" + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + last3 + dec; }
  function inWords(n) {
    n = Math.floor(n); if (!n) return "Zero";
    var a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    var b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    var two = function (x) { return x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : ""); };
    var three = function (x) { return (x >= 100 ? a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " : "") : "") + (x % 100 ? two(x % 100) : ""); };
    var out = [], cr = Math.floor(n / 1e7); n %= 1e7; var l = Math.floor(n / 1e5); n %= 1e5; var th = Math.floor(n / 1e3); n %= 1e3;
    if (cr) out.push(three(cr) + " Crore"); if (l) out.push(two(l) + " Lakh"); if (th) out.push(two(th) + " Thousand"); if (n) out.push(three(n));
    return out.join(" ");
  }
  function doseText(d) {
    var p = String(d || "").split("-"); if (p.length !== 3) return d || "";
    var slots = ["Morning", "Afternoon", "Night"], out = [];
    p.forEach(function (x, i) { if (x && x !== "0") out.push(x + " " + slots[i]); });
    return out.join(", ") || "As directed";
  }
  function vitalsParts(v) {
    if (!v) return [];
    var parts = [];
    if (v.bpSys) parts.push(["BP", v.bpSys + "/" + v.bpDia + " mmHg"]);
    if (v.pulse) parts.push(["Pulse", v.pulse + " bpm"]);
    if (v.temp) parts.push(["Temp", v.temp + " °F"]);
    if (v.spo2) parts.push(["SpO₂", v.spo2 + "%"]);
    if (v.resp) parts.push(["RR", v.resp + "/min"]);
    if (v.height) parts.push(["Height", v.height + " cm"]);
    if (v.weight) parts.push(["Weight", v.weight + " kg"]);
    if (v.bmi) parts.push(["BMI", v.bmi + " kg/m²"]);
    if (v.sugar) parts.push([v.sugarType || "RBS", v.sugar + " mg/dL"]);
    return parts;
  }
  function vitalsLine(v) { return vitalsParts(v).map(function (p) { return "<b>" + esc(p[0]) + "</b> " + esc(p[1]); }).join(" | "); }

  /* ---------------- printable documents ---------------- */
  // Skin Shine "S" logo (blue swirl from the clinic signboard)
  var LOGO_SVG = '<svg viewBox="0 0 40 40" width="54" height="54" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#fff" stroke="#DCEBF8" stroke-width="1"/><path d="M26.06 9.5A7 7 0 1 0 20 20" fill="none" stroke="#1E88D0" stroke-width="6" stroke-linecap="round"/><path d="M20 20A7 7 0 1 1 13.94 30.5" fill="none" stroke="#0F4C81" stroke-width="6" stroke-linecap="round"/></svg>';
  var DOC_CSS = [
    ".rxdoc{font-family:'Plus Jakarta Sans',Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#111;font-size:13px;line-height:1.45;background:#fff}",
    ".rx-h{display:flex;flex-direction:column;align-items:flex-start;gap:12px;padding-bottom:12px;border-bottom:2px solid #1565A8;text-align:left}",
    ".rx-h .clinic{display:flex;gap:12px;align-items:center}",
    ".rx-h .clinic svg{flex:none}",
    ".rx-h .clinic b{display:block;font-size:20px;color:#0F4C81}",
    ".rx-h .clinic small{display:block;color:#1747A6;font-weight:700;font-size:11.5px}",
    ".rx-h .clinic span{display:block;color:#444;font-size:11.5px}",
    ".rx-h .doc-info{text-align:left;border-left:3px solid #1E88D0;padding-left:12px}",
    ".rx-h .doc-info b{display:block;font-size:19px;color:#1747A6}",
    ".rx-h .doc-info .spec{color:#C2362B;font-weight:700}",
    ".rx-h .doc-info span{display:block;font-size:12px;color:#333}",
    ".rx-note{font-weight:700;font-size:12px;padding:8px 0;border-bottom:1px solid #ccc}",
    ".rx-pt{display:grid;grid-template-columns:auto 1fr;gap:2px 18px;padding:10px 0;border-bottom:1px solid #999;font-size:12.5px}",
    ".rx-pt b{font-weight:800}",
    ".rx-vitals{padding:8px 0;font-size:12.5px}",
    ".rx-sec{margin:6px 0;white-space:pre-line}",
    ".rx-sec>b{font-weight:800}",
    ".rx-symbol{font-family:Georgia,serif;font-size:26px;font-weight:700;margin:8px 0 2px}",
    ".rx-table{width:100%;border-collapse:collapse;font-size:12.5px}",
    ".rx-table th{background:none;text-align:left;font-weight:700;color:#111;border-top:1.5px solid #333;border-bottom:1.5px solid #333;padding:6px 8px;text-transform:none;letter-spacing:0;font-size:12.5px}",
    ".rx-table td{padding:7px 8px;border-bottom:1px solid #bbb;vertical-align:top}",
    ".rx-table td .mname{font-weight:800;text-transform:uppercase}",
    ".rx-table td .msub{display:block;font-size:11.5px;color:#444;padding-left:14px}",
    ".rx-sign{display:flex;justify-content:flex-start;margin-top:24px;text-align:left}",
    ".rx-sign .sig{font-family:'Brush Script MT','Segoe Script',cursive;font-size:24px;color:#1747A6}",
    ".rx-foot{margin-top:18px;padding-top:8px;border-top:1px solid #999;text-align:left;font-size:11px;color:#444}",
    ".rcpt-title{display:flex;justify-content:space-between;align-items:center;margin:14px 0;gap:12px;flex-wrap:wrap}",
    ".rcpt-title h3{font-size:18px;letter-spacing:.12em;color:#0F4C81;margin:0}",
    ".stamp{border:3px solid currentColor;border-radius:10px;padding:4px 14px;font-weight:800;font-size:20px;letter-spacing:.15em;transform:rotate(-8deg);display:inline-block}",
    ".stamp.paid{color:#13795B}.stamp.due{color:#C2362B}",
  ].join("\n");

  function clinicHeader(s, right) {
    s = s || {};
    return '<div class="rx-h"><div class="clinic">' + LOGO_SVG + '<div><b>' + esc(s.clinicName) + '</b><small>' + esc(s.tagline) + '</small><span>' + esc(s.address) + '</span></div></div><div class="doc-info">' + right + '</div></div>';
  }
  function rxDoc(rx, s) {
    s = s || {};
    var sec = function (label, val) { return val ? '<div class="rx-sec"><b>' + label + ':</b> ' + esc(val) + '</div>' : ""; };
    var meds = (rx.medicines || []).map(function (m, i) {
      return '<tr><td>' + (i + 1) + ')</td><td><span class="mname">' + esc(m.name) + '</span>' +
        (m.composition ? '<span class="msub">Composition: ' + esc(m.composition) + '</span>' : "") +
        '<span class="msub">Timing: ' + esc(doseText(m.dosage)) + '</span>' +
        (m.notes ? '<span class="msub">Notes: ' + esc(m.notes) + '</span>' : "") +
        '</td><td><b>' + esc(String(m.dosage || "").replace(/-/g, " – ")) + '</b></td><td>' + esc([m.timing, m.frequency, m.duration].filter(Boolean).join(" – ")) + '</td></tr>';
    }).join("");
    return '<div class="rxdoc">' +
      clinicHeader(s, '<b>' + esc(rx.doctorName) + '</b><span>' + esc(rx.doctorQualification || "") + '</span><span class="spec">' + esc(rx.doctorSpecialty || "") + '</span><span>Regn No. ' + esc(rx.doctorRegNo || "—") + '</span><span>Contact: ' + esc(s.phone) + '</span><span>' + esc(s.email) + '</span>') +
      (s.rxNote ? '<div class="rx-note">' + esc(s.rxNote) + '</div>' : "") +
      '<div class="rx-pt"><b>' + esc(rx.patientUhid || "") + '</b><span>: <b>' + esc(String(rx.patientName || "").toUpperCase()) + '</b> (' + esc(rx.patientAge != null ? rx.patientAge + "y" : "") + (rx.patientGender ? ", " + esc(rx.patientGender) : "") + ')</span>' +
      '<b>Date &amp; Time</b><span>: ' + fmtDate(rx.date) + ' ' + fmtTime(rx.time) + '</span><b>Rx No.</b><span>: ' + esc(rx.number || "Draft") + '</span></div>' +
      (rx.vitals ? '<div class="rx-vitals">' + vitalsLine(rx.vitals) + '</div>' : "") +
      sec("Quick Notes", rx.complaints) + sec("General Examination", rx.examination) + sec("Diagnosis", rx.diagnosis) + sec("Diet and Exercise", rx.diet) +
      '<div class="rx-symbol">℞</div>' +
      '<table class="rx-table"><thead><tr><th style="width:28px"></th><th>Medicine</th><th style="width:110px">Dosage</th><th>Timing – Freq. – Duration</th></tr></thead><tbody>' + meds + '</tbody></table>' +
      sec("Advice", rx.advice) +
      (rx.tests ? '<div class="rx-sec"><b>Tests Prescribed' + (rx.testsAfter ? ' [after ' + esc(rx.testsAfter) + ']' : "") + ':</b> ' + esc(rx.tests) + '</div>' : "") +
      (rx.followUp ? '<div class="rx-sec"><b>Follow-up on:</b> ' + fmtDate(rx.followUp) + '</div>' : "") +
      '<div class="rx-sign"><div><div class="sig">' + esc(String(rx.doctorName || "").replace(/^Dr\.?\s*/, "")) + '</div><b>' + esc(rx.doctorName) + '</b><div style="font-size:11.5px">' + esc(rx.doctorQualification || "") + '</div></div></div>' +
      '<div class="rx-foot">' + esc(s.address) + ' · For appointments call ' + esc(s.phone) + ' · ' + esc(s.timings) + '<br>Powered by ShabiHub</div></div>';
  }
  function receiptDoc(inv, s) {
    s = s || {};
    var sub = inv.items.reduce(function (a, i) { return a + i.amount; }, 0);
    return '<div class="rxdoc">' + clinicHeader(s, '<span>Phone: ' + esc(s.phone) + '</span><span>' + esc(s.email) + '</span><span>' + esc(s.timings) + '</span>') +
      '<div class="rcpt-title"><div><h3>PAYMENT RECEIPT</h3><div>Receipt No. <b>' + esc(inv.number) + '</b> · ' + fmtDate(inv.date) + ' ' + fmtTime(inv.time) + '</div></div><span class="stamp ' + (inv.status === "paid" ? "paid" : "due") + '">' + (inv.status === "paid" ? "PAID" : "DUE") + '</span></div>' +
      '<div class="rx-pt"><b>Received from</b><span>: <b>' + esc(String(inv.patientName || "").toUpperCase()) + '</b> (' + esc(inv.patientAge != null ? inv.patientAge + "y" : "") + (inv.patientGender ? ", " + esc(inv.patientGender) : "") + ')</span><b>UHID</b><span>: ' + esc(inv.patientUhid || "—") + '</span></div>' +
      '<table class="rx-table" style="margin-top:10px"><thead><tr><th style="width:36px">#</th><th>Description</th><th style="text-align:right;width:120px">Amount</th></tr></thead><tbody>' +
      inv.items.map(function (i, k) { return '<tr><td>' + (k + 1) + '</td><td>' + esc(i.description) + '</td><td style="text-align:right">' + money(i.amount) + '</td></tr>'; }).join("") +
      '<tr><td></td><td style="text-align:right">Subtotal</td><td style="text-align:right">' + money(sub) + '</td></tr>' +
      (inv.discount ? '<tr><td></td><td style="text-align:right">Discount</td><td style="text-align:right">− ' + money(inv.discount) + '</td></tr>' : "") +
      '<tr><td></td><td style="text-align:right"><b>Total</b></td><td style="text-align:right"><b style="font-size:15px">' + money(inv.total) + '</b></td></tr></tbody></table>' +
      '<p style="margin:12px 0 4px"><b>Amount in words:</b> Rupees ' + inWords(inv.total) + ' Only</p>' +
      '<p style="margin:0">' + (inv.status === "paid" ? '<b>Payment mode:</b> ' + esc(inv.mode || "—") : "<b>Payment pending</b>") + (inv.receivedByName ? ' · <b>Received by:</b> ' + esc(inv.receivedByName) : "") + '</p>' +
      '<div class="rx-sign"><div><div class="sig">' + esc(s.clinicName) + '</div><b>Authorised signatory</b></div></div>' +
      '<div class="rx-foot">This is a computer-generated receipt. · ' + esc(s.address) + '<br>Powered by ShabiHub</div></div>';
  }
  // A complete printable page (used by the mobile app to make PDFs)
  function printablePage(innerHtml, title) {
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title || "Skin Shine") + '</title><style>@page{margin:12mm}body{margin:0;padding:8px}' + DOC_CSS + '</style></head><body>' + innerHtml + '</body></html>';
  }

  return {
    MEDS: MEDS, QUICK: QUICK, DOSE_OPTS: DOSE_OPTS, WHEN_OPTS: WHEN_OPTS, FREQ_OPTS: FREQ_OPTS, DIAGNOSES: DIAGNOSES, RECEIPT_ITEMS: RECEIPT_ITEMS,
    searchMeds: searchMeds, esc: esc, todayStr: todayStr, fmtDate: fmtDate, fmtTime: fmtTime, money: money, inWords: inWords,
    doseText: doseText, vitalsParts: vitalsParts, vitalsLine: vitalsLine,
    DOC_CSS: DOC_CSS, LOGO_SVG: LOGO_SVG, clinicHeader: clinicHeader, rxDoc: rxDoc, receiptDoc: receiptDoc, printablePage: printablePage,
  };
});
