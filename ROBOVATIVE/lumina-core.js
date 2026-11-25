/* =====================================================================
   Lumina Health \u2014 shared core: data model, demo data, roles & permissions.
   Used by server.js (real database in data.json) AND by the browser
   (demo mode, stored in localStorage) so the rules are identical.
   ===================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.LuminaCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------------- helpers ---------------- */
  function HttpError(status, msg) { var e = new Error(msg); e.status = status; return e; }
  var fail = function (s, m) { throw HttpError(s, m); };
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var ymd = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var hm = function (d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  var dayOffset = function (n) { var d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
  var today = function () { return ymd(new Date()); };
  var nowIso = function () { return new Date().toISOString(); };
  var str = function (v, max) { max = max || 200; return typeof v === "string" ? v.trim().slice(0, max) : (typeof v === "number" && isFinite(v) ? String(v) : ""); };
  var need = function (v, name, max) { var s = str(v, max); if (!s) fail(400, name + " is required"); return s; };
  var bool = function (v) { return v === true || v === "true" || v === "1"; };
  var num = function (v, min, max, name) {
    if (v === "" || v === null || v === undefined) return null;
    var n = Number(v); if (!isFinite(n) || n < min || n > max) fail(400, "Please enter a valid " + name);
    return Math.round(n * 100) / 100;
  };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, DATE_RE = /^\d{4}-\d{2}-\d{2}$/, TIME_RE = /^\d{2}:\d{2}$/, PHONE_RE = /^[6-9]\d{9}$/;
  var cleanPhone = function (v) { return str(v, 20).replace(/[\s\-()]/g, "").replace(/^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))/, ""); };
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };

  var ROLES = ["admin", "doctor", "nurse", "reception", "pharmacy", "patient"];
  var STAFF = ["admin", "doctor", "nurse", "reception"];
  var VIEW_PATIENTS = STAFF.concat(["pharmacy"]);

  /* Clinic profiles used for sample data. The real clinic details for Skin Shine come from the clinic;
     sample patients are fictional. Admins can change all clinic details later in Clinic settings. */
  var DEFAULT_PROFILE = "skinshine";
  var PROFILES = {
    skinshine: {
      adminName: "Clinic Admin",
      doctor: { name: "Dr. Syed Yousuf Ali", qualification: "MBBS, MD (DVL)", specialty: "Dermatologist & Cosmetologist \u00b7 20+ years", regNo: "[Add registration no.]", phone: "9052446842" },
      settings: {
        clinicName: "Skin Shine", tagline: "Advanced Clinic for Skin, Hair & Nail",
        address: "Door No. 13-6-43/3, 1st Floor, Opp. Pillar No. 100, Moghal Nagar, Attapur Chowrasta, Gudimalkapur, Mehdipatnam, Hyderabad, Telangana 500008",
        phone: "+91 90524 46842", email: "", timings: "Mon\u2013Sat, 3:00 PM \u2013 5:00 PM",
        openTime: "15:00", closeTime: "17:00", slotMinutes: 10, consultFee: 500, closedDays: [0],
        rxNote: "Consultation valid for 1 week (1 visit + 1 review). Please bring this prescription on your next visit.",
      },
    },
    demo: {
      adminName: "Asha Menon",
      doctor: { name: "Dr. Meera Rao", qualification: "MBBS, MD (DVL)", specialty: "Dermatologist & Cosmetologist", regNo: "TSMC 00000 (dummy)", phone: "9000000100" },
      settings: {
        clinicName: "ShabiHub Demo Clinic", tagline: "Skin, Hair & Nail Care",
        address: "[Street address placeholder], Banjara Hills, Hyderabad 500034", phone: "040-0000 0000 (dummy)", email: "care@example.com",
        timings: "Mon\u2013Sat, 10:00 AM \u2013 8:00 PM", openTime: "10:00", closeTime: "20:00", slotMinutes: 15, consultFee: 500, closedDays: [0],
        rxNote: "Consultation valid for 1 week (1 visit + 1 review).",
      },
    },
  };
  var APPT_STATUS = ["requested", "booked", "checked-in", "completed", "cancelled", "no-show"];

  function create(opts) {
    var hash = opts.hash, verify = opts.verify, rand = opts.rand;
    var newId = function (p) { return p + "_" + rand(5); };

    /* ---------------- demo data ----------------
       seed(profile): "skinshine" = Skin Shine (real clinic details, fictional sample patients),
                      "demo" = generic Lumina demo clinic with placeholder details. */
    function seed(profileKey) {
      var prof = PROFILES[profileKey] || PROFILES[DEFAULT_PROFILE];
      var u = function (name, email, role, pw, extra) { return Object.assign({ id: newId("u"), name: name, email: email, role: role, password: hash(pw), active: true, phone: "", createdAt: nowIso() }, extra || {}); };
      var admin = u(prof.adminName, "admin@shabihub.local", "admin", "Admin@123", { phone: "9000000001" });
      var doc = u(prof.doctor.name, "doctor@shabihub.local", "doctor", "Doctor@123", { specialty: prof.doctor.specialty, qualification: prof.doctor.qualification, regNo: prof.doctor.regNo, phone: prof.doctor.phone || "" });
      var nurse = u("Sr. Lakshmi Priya", "nurse@shabihub.local", "nurse", "Nurse@123", { phone: "9000000200" });
      var rec = u("Kavya Reddy", "reception@shabihub.local", "reception", "Reception@123", { phone: "9000000300" });
      var pharm = u("Rahim Pasha", "pharmacy@shabihub.local", "pharmacy", "Pharmacy@123", { phone: "9000000400" });

      var P = function (uhid, name, age, gender, phone, city, blood, allergies, extra) {
        return Object.assign({ id: "p_" + uhid, uhid: String(uhid), name: name, age: age, gender: gender, phone: phone, email: "", address: "[Address]", city: city, bloodGroup: blood, abha: "", emergencyContact: "", allergies: allergies, createdAt: new Date(Date.now() - (26000 - uhid) * 36e5).toISOString() }, extra || {});
      };
      var patients = [
        P(25001, "Arjun Kumar", 42, "Male", "9876500001", "Mehdipatnam", "B+", "None known"),
        P(25002, "Priya Sharma", 24, "Female", "9876500002", "Tolichowki", "O+", "Penicillin"),
        P(25003, "Rahul Nair", 8, "Male", "9876500003", "Attapur", "A+", "None known", { emergencyContact: "Anil Nair (father) 9876500033" }),
        P(25004, "Sunita Reddy", 56, "Female", "9876500004", "Rajendranagar", "B+", "Sulfa drugs"),
        P(25005, "Mohammed Irfan", 19, "Male", "9876500005", "Moghal Nagar", "O+", "None known"),
        P(25006, "Lakshmi Devi", 64, "Female", "9876500006", "Langar Houz", "AB+", "None known"),
        P(25007, "Vikram Patel", 47, "Male", "9876500007", "Masab Tank", "A-", "Aspirin"),
        P(25008, "Ananya Iyer", 27, "Female", "9876500008", "Gachibowli", "O-", "None known"),
        P(25009, "Sai Teja", 22, "Male", "9876500009", "Kishanbagh", "B-", "None known"),
        P(25010, "Fatima Begum", 51, "Female", "9876500010", "Mehdipatnam", "A+", "None known"),
        P(25011, "Ramesh Gupta", 60, "Male", "9876500011", "Attapur", "O+", "Iodine"),
        P(25012, "Kavitha Rao", 35, "Female", "9876500012", "Gudimalkapur", "B+", "None known"),
      ];
      var pat = u("Arjun Kumar", "patient@shabihub.local", "patient", "Patient@123", { patientId: "p_25001", phone: "9876500001" });

      // appointment times inside the clinic's opening hours
      var open = prof.settings.openTime.split(":"), step = prof.settings.slotMinutes;
      var slot = function (i) { var m = (+open[0]) * 60 + (+open[1]) + i * step; return pad(Math.floor(m / 60)) + ":" + pad(m % 60); };

      var appointments = [], vitals = [], prescriptions = [], invoices = [];
      var A = function (pid, day, i, status, type, reason) {
        var a = { id: newId("a"), patientId: pid, doctorId: doc.id, date: dayOffset(day), time: slot(i), status: status, type: type || "In-clinic", reason: reason || "", vitalsDone: false, createdAt: nowIso() };
        appointments.push(a); return a;
      };
      var V = function (a, v) {
        var r = Object.assign({ id: newId("v"), patientId: a.patientId, appointmentId: a.id, date: a.date, time: a.time, bpSys: null, bpDia: null, pulse: null, temp: null, spo2: null, resp: null, height: null, weight: null, bmi: null, sugar: null, sugarType: "RBS", notes: "", recordedBy: nurse.id, createdAt: nowIso() }, v);
        if (r.height && r.weight) r.bmi = Math.round(r.weight / Math.pow(r.height / 100, 2) * 100) / 100;
        vitals.push(r); a.vitalsDone = true; return r;
      };
      var counters = { uhid: 25012, invoice: 1000, rx: 3000 };
      var R = function (a, data) {
        var v = vitals.filter(function (x) { return x.appointmentId === a.id; })[0] || null;
        var rx = Object.assign({ id: newId("rx"), number: "RX-" + (++counters.rx), patientId: a.patientId, doctorId: doc.id, appointmentId: a.id, date: a.date, time: a.time, vitals: v ? clone(v) : null, complaints: "", examination: "", diagnosis: "", diet: "", medicines: [], advice: "", tests: "", testsAfter: "", followUp: "", createdAt: nowIso() }, data);
        prescriptions.push(rx); return rx;
      };
      var I = function (pid, day, time, items, status, mode, discount) {
        var sub = items.reduce(function (s, i) { return s + i.amount; }, 0);
        var date = dayOffset(day);
        var inv = { id: newId("inv"), number: "SS-" + (++counters.invoice), patientId: pid, date: date, time: time, items: items, discount: discount || 0, total: sub - (discount || 0), status: status, mode: status === "paid" ? mode : "", receivedBy: rec.id, paidAt: status === "paid" ? new Date(date + "T" + time + ":00").toISOString() : "", createdAt: nowIso() };
        invoices.push(inv); return inv;
      };
      var M = function (name, composition, dosage, timing, frequency, duration, notes) { return { name: name, composition: composition, dosage: dosage, timing: timing, frequency: frequency, duration: duration, notes: notes || "" }; };
      var fee = prof.settings.consultFee, consult = function (label) { return { description: (label || "Consultation") + " - " + doc.name, amount: label === "Review" ? Math.round(fee * 0.6) : fee }; };

      // ---- past visits ----
      var a1 = A("p_25005", -4, 2, "completed", "In-clinic", "Pimples on face for 6 months");
      V(a1, { bpSys: 118, bpDia: 76, pulse: 82, height: 172, weight: 64, spo2: 99 });
      R(a1, { complaints: "Pimples and blackheads on face and back x 6 months\nOily skin, picks at lesions", examination: "Comedones, papules and few pustules over cheeks and forehead\nPost-inflammatory hyperpigmentation", diagnosis: "Acne vulgaris (grade II) with PIH", diet: "Avoid oily, fried food and whey protein. Drink 3 litres of water daily",
        medicines: [
          M("Cap. Doxt-SL 100", "Doxycycline 100 mg", "0-0-1", "After food", "Daily", "6 Weeks", "Do not lie down for 30 min after the tablet"),
          M("Gel Adaferin", "Adapalene 0.1%", "0-0-1", "Apply locally", "Daily", "2 Months", "Pea-sized amount on whole face at night"),
          M("Gel Clindac A", "Clindamycin 1%", "1-0-0", "Apply locally", "Daily", "6 Weeks", "On pimples only"),
          M("Face wash Saslic DS", "Salicylic acid 2% face wash", "1-0-1", "Apply locally", "Daily", "2 Months"),
          M("Lotion Suncros SPF 50", "Sunscreen SPF 50", "1-1-0", "Apply locally", "Daily", "3 Months", "Reapply every 3 hours outdoors"),
        ], advice: "Do not squeeze or pick pimples. Mild redness and peeling in the first 2 weeks is expected.", followUp: dayOffset(24) });
      I("p_25005", -4, slot(3), [consult()], "paid", "UPI");

      var a2 = A("p_25004", -7, 1, "completed", "In-clinic", "Itchy red patches on waist");
      V(a2, { bpSys: 142, bpDia: 90, pulse: 80, height: 158, weight: 69, sugar: 168, sugarType: "RBS", spo2: 97 });
      R(a2, { complaints: "Itchy ring-like red patches on waist and thighs x 2 months\nUsed steroid creams from pharmacy", examination: "Annular scaly plaques with active border over waist and groin", diagnosis: "Tinea corporis et cruris", diet: "",
        medicines: [
          M("Cap. Itaspor 200", "Itraconazole 200 mg", "1-0-0", "After food", "Daily", "3 Weeks"),
          M("Cream Lulifin", "Luliconazole 1%", "1-0-1", "Apply locally", "Daily", "4 Weeks", "Apply 2 cm beyond the patch"),
          M("Tab. Levocet 5", "Levocetirizine 5 mg", "0-0-1", "After food", "Daily", "10 Days"),
        ], advice: "Stop all steroid creams. Keep the area dry, wear loose cotton clothes, use a separate towel and wash clothes in hot water.", tests: "FBS, PPBS", followUp: dayOffset(14) });
      I("p_25004", -7, slot(2), [consult()], "paid", "Cash");

      var a3 = A("p_25008", -6, 4, "completed", "In-clinic", "Hair fall x 4 months");
      V(a3, { bpSys: 110, bpDia: 70, pulse: 78, height: 162, weight: 54 });
      R(a3, { complaints: "Diffuse hair fall x 4 months, widening of hair partition\nRecent crash dieting", examination: "Widened central partition, positive hair pull test", diagnosis: "Female pattern hair loss with telogen effluvium", diet: "Protein-rich diet: eggs, dal, paneer, sprouts. Avoid crash diets",
        medicines: [
          M("Solution Mintop 5%", "Minoxidil 5%", "0-0-1", "Apply locally", "Daily", "3 Months", "1 ml on dry scalp, do not wash for 4 hours"),
          M("Tab. Follihair", "Biotin + multivitamins", "1-0-0", "After food", "Daily", "3 Months"),
          M("Shampoo Scalpe Plus", "Ketoconazole + Zinc pyrithione", "1-0-0", "Apply locally", "Twice a week", "1 Month"),
        ], advice: "Hair fall may increase for the first 4-6 weeks of minoxidil; this is temporary. PRP sessions advised every 4 weeks.", tests: "CBC, Serum ferritin, TSH, Vitamin D3", testsAfter: "1 Week", followUp: dayOffset(22) });
      I("p_25008", -6, slot(6), [consult(), { description: "PRP therapy for hair (session 1)", amount: 4000 }], "paid", "Card", 500);

      var a4 = A("p_25006", -5, 0, "completed", "In-clinic", "Dry cracked itchy hands");
      R(a4, { complaints: "Dry, cracked, itchy palms x 1 year. Worse after washing utensils", examination: "Dry scaly fissured plaques over both palms", diagnosis: "Hand eczema (chronic irritant dermatitis)",
        medicines: [
          M("Cream Momate", "Mometasone 0.1%", "0-0-1", "Apply locally", "Daily", "2 Weeks", "Thin layer on palms only"),
          M("Lotion Cetaphil Moisturising", "Moisturising lotion", "1-1-1", "Apply locally", "Daily", "1 Month", "After every hand wash"),
          M("Tab. Atarax 10", "Hydroxyzine 10 mg", "0-0-1", "After food", "SOS", "7 Days", "For itching at night; may cause drowsiness"),
        ], advice: "Wear cotton-lined rubber gloves for washing. Avoid detergents and soaps directly on hands.", followUp: dayOffset(9) });
      I("p_25006", -5, slot(1), [consult()], "paid", "UPI");

      var a5 = A("p_25003", -9, 5, "completed", "In-clinic", "Itching at night, whole family");
      V(a5, { temp: 98.6, pulse: 96, weight: 24, height: 126 });
      R(a5, { complaints: "Severe itching worse at night x 3 weeks. Siblings also itching", examination: "Excoriated papules over finger webs, wrists and waist", diagnosis: "Scabies",
        medicines: [
          M("Cream Permite", "Permethrin 5%", "0-0-1", "Apply locally", "Once", "1 Day", "Neck down at night, wash after 8-12 hours; repeat after 1 week"),
          M("Syp. Levocet", "Levocetirizine 2.5 mg/5 ml", "0-0-5ml", "After food", "Daily", "7 Days"),
        ], advice: "All family members must be treated on the same night. Wash clothes and bed sheets in hot water and dry in sunlight.", followUp: dayOffset(-2) });
      I("p_25003", -9, slot(6), [consult()], "paid", "Cash");

      var a6 = A("p_25001", -10, 3, "completed", "In-clinic", "Dandruff and flaking near eyebrows");
      V(a6, { bpSys: 138, bpDia: 88, pulse: 80, height: 172, weight: 85, sugar: 204, sugarType: "RBS", spo2: 98, temp: 98.4 });
      R(a6, { complaints: "Dandruff, itchy scalp and flaking over eyebrows and sides of nose x 3 months", examination: "Greasy scales over scalp, eyebrows and nasolabial folds", diagnosis: "Seborrhoeic dermatitis", diet: "Reduce sugar and fried food. Known diabetic: please get sugars checked",
        medicines: [
          M("Shampoo Nizral", "Ketoconazole 2%", "1-0-0", "Apply locally", "Twice a week", "4 Weeks", "Leave on scalp for 5 minutes before washing"),
          M("Cream Lulifin", "Luliconazole 1%", "0-0-1", "Apply locally", "Daily", "2 Weeks", "Thin layer on eyebrows and sides of nose"),
          M("Tab. Levocet 5", "Levocetirizine 5 mg", "0-0-1", "After food", "Daily", "10 Days"),
        ], advice: "Avoid oiling the scalp. Condition may recur; repeat shampoo once a week after the course.", tests: "FBS, PPBS, HbA1c", testsAfter: "1 Week", followUp: dayOffset(0) });
      I("p_25001", -10, slot(4), [consult()], "paid", "UPI");

      var a7 = A("p_25007", -3, 2, "completed", "In-clinic", "Warts on fingers");
      V(a7, { bpSys: 128, bpDia: 82, pulse: 76, weight: 78, height: 170 });
      R(a7, { complaints: "Multiple rough growths on fingers x 1 year, increasing in number", examination: "Verrucous papules over right index and middle fingers", diagnosis: "Common warts (verruca vulgaris) - removed by RF cautery",
        medicines: [
          M("Cream Fucidin", "Fusidic acid 2%", "1-0-1", "Apply locally", "Daily", "7 Days", "On treated area until healed"),
          M("Tab. Dolo 650", "Paracetamol 650 mg", "1-0-1", "After food", "SOS", "3 Days", "Only if pain"),
        ], advice: "Keep the area dry for 24 hours. Do not pick scabs. Review after 2 weeks for any new warts.", followUp: dayOffset(11) });
      I("p_25007", -3, slot(4), [consult(), { description: "Wart removal (RF cautery)", amount: 1500 }], "paid", "UPI");

      I("p_25012", -2, slot(5), [consult(), { description: "Chemical peel (glycolic)", amount: 2500 }], "paid", "UPI");
      I("p_25010", -1, slot(3), [consult("Review")], "paid", "Cash");
      I("p_25011", -8, slot(2), [consult(), { description: "Nail surgery (partial nail avulsion)", amount: 3000 }], "paid", "Card");
      I("p_25002", -12, slot(1), [consult()], "paid", "UPI");

      // ---- today ----
      var t0 = A("p_25011", 0, 0, "completed", "In-clinic", "Thick discoloured toenails");
      V(t0, { bpSys: 130, bpDia: 84, pulse: 74, weight: 72, height: 168, sugar: 142, sugarType: "RBS" });
      R(t0, { complaints: "Thick, yellow, crumbling big toenails x 1 year", examination: "Distal subungual onychomycosis of both great toenails", diagnosis: "Onychomycosis (toenails)",
        medicines: [
          M("Tab. Terbicip 250", "Terbinafine 250 mg", "1-0-0", "After food", "Daily", "3 Months"),
          M("Lacquer Loceryl", "Amorolfine 5% nail lacquer", "1-0-0", "Apply locally", "Weekly", "6 Months", "File the nail surface before applying"),
          M("Cream Lulifin", "Luliconazole 1%", "0-0-1", "Apply locally", "Daily", "1 Month", "Between the toes"),
        ], advice: "Keep feet dry, wear cotton socks and change daily. Do not share footwear or nail cutters.", tests: "LFT", testsAfter: "1 Month", followUp: dayOffset(30) });
      I("p_25011", 0, slot(1), [consult()], "paid", "UPI");
      var t1 = A("p_25001", 0, 1, "checked-in", "In-clinic", "Review - dandruff better, new itchy rash on neck");
      V(t1, { bpSys: 134, bpDia: 86, pulse: 78, height: 172, weight: 84, sugar: 186, sugarType: "RBS", spo2: 98, temp: 98.2 });
      A("p_25002", 0, 2, "checked-in", "In-clinic", "Pimples and dark spots on cheeks");
      A("p_25012", 0, 3, "checked-in", "In-clinic", "Brown patches on cheeks (melasma)");
      A("p_25007", 0, 4, "booked", "In-clinic", "Review after wart removal");
      A("p_25009", 0, 5, "booked", "Video", "Hair fall and dandruff");
      A("p_25003", 0, 6, "booked", "In-clinic", "Review after scabies treatment");
      A("p_25010", 0, 7, "requested", "In-clinic", "Itching all over body");
      I("p_25001", 0, slot(1), [consult("Review")], "unpaid", "");
      // ---- upcoming ----
      A("p_25004", 2, 1, "booked", "In-clinic", "Fungal infection review");
      A("p_25001", 3, 2, "booked", "In-clinic", "Lab report review");
      A("p_25008", 7, 3, "booked", "In-clinic", "PRP session 2");

      return {
        settings: clone(prof.settings),
        users: [admin, doc, nurse, rec, pharm, pat],
        patients: patients, appointments: appointments, vitals: vitals, prescriptions: prescriptions, invoices: invoices,
        leads: [
          { id: newId("l"), type: "demo", name: "Sample Website Visitor", email: "visitor@example.com", phone: "9876500999", specialty: "Dermatology", city: "Hyderabad", organisation: "", topic: "", message: "", page: "index.html", status: "new", createdAt: nowIso() },
        ],
        inventory: (function () {
          var I2 = function (barcode, name, company, batch, expDays, mrp, rate, qty, minQty) {
            var d = new Date(); d.setDate(d.getDate() + expDays);
            var last = new Date(d.getFullYear(), d.getMonth() + 1, 0); // strips print month/year: use the month's last day
            return { id: newId("st"), barcode: barcode, name: name, company: company, batch: batch, expiry: ymd(last), mrp: mrp, purchaseRate: rate, qty: qty, minQty: minQty, createdAt: nowIso(), updatedAt: nowIso() };
          };
          return [
            I2("8901000000011", "Cap. Doxt-SL 100", "Dr. Reddy's", "DX2401", 420, 128, 92, 60, 20),
            I2("8901000000028", "Gel Adaferin", "Galderma", "AD2312", 300, 395, 290, 18, 10),
            I2("8901000000035", "Gel Clindac A", "Galderma", "CL2405", 75, 172, 125, 12, 10),
            I2("8901000000042", "Lotion Suncros SPF 50", "Sun Pharma", "SC2402", 510, 625, 455, 6, 8),
            I2("8901000000059", "Face wash Saslic DS", "Ajanta", "SA2311", -20, 340, 248, 4, 5),
            I2("8901000000066", "Solution Mintop 5%", "Dr. Reddy's", "MT2406", 620, 760, 560, 9, 6),
            I2("8901000000073", "Tab. Follihair", "Dr. Reddy's", "FH2403", 40, 415, 300, 25, 10),
            I2("8901000000080", "Cap. Itaspor 200", "Intas", "IT2404", 480, 465, 340, 30, 10),
            I2("8901000000097", "Cream Lulifin", "Sun Pharma", "LU2402", 210, 298, 215, 2, 6),
            I2("8901000000103", "Tab. Levocet 5", "Hetero", "LV2405", 700, 22, 14, 120, 30),
            I2("8901000000110", "Tab. Atarax 10", "Dr. Reddy's", "AT2312", -45, 72, 50, 15, 10),
            I2("8901000000127", "Cream Momate", "Glenmark", "MM2407", 560, 168, 120, 14, 8),
          ];
        })(),
        stockLog: [],
        counters: counters,
      };
    }

    /* ---------------- lookups ---------------- */
    function pub(u) { var o = Object.assign({}, u); delete o.password; return o; }
    function names(db, x) {
      var p = db.patients.filter(function (q) { return q.id === x.patientId; })[0] || {};
      var o = Object.assign({}, x, { patientName: p.name || "Unknown patient", patientUhid: p.uhid || "", patientAge: p.age, patientGender: p.gender || "" });
      if (x.doctorId) { var d = db.users.filter(function (u) { return u.id === x.doctorId; })[0] || {}; o.doctorName = d.name || "Unknown"; o.doctorSpecialty = d.specialty || ""; o.doctorQualification = d.qualification || ""; o.doctorRegNo = d.regNo || ""; }
      if (x.recordedBy) o.recordedByName = (db.users.filter(function (u) { return u.id === x.recordedBy; })[0] || {}).name || "";
      if (x.receivedBy) o.receivedByName = (db.users.filter(function (u) { return u.id === x.receivedBy; })[0] || {}).name || "";
      return o;
    }
    var byDateDesc = function (a, b) { return (b.date + (b.time || "")).localeCompare(a.date + (a.time || "")); };
    var byDateAsc = function (a, b) { return (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")); };
    var findOr404 = function (list, id, what) { return list.filter(function (x) { return x.id === id; })[0] || fail(404, what + " not found"); };
    var ownPatient = function (me, pid) { return me.role === "patient" && me.patientId === pid; };

    /* ---------------- routes ---------------- */
    var routes = [];
    function route(method, pattern, roles, fn) {
      var keys = [];
      var re = new RegExp("^" + pattern.replace(/:(\w+)/g, function (_, k) { keys.push(k); return "([^/]+)"; }) + "$");
      routes.push({ method: method, re: re, keys: keys, roles: roles, fn: fn });
    }

    // ---- account ----
    route("GET", "/api/me", "any", function (c) { return { user: pub(c.me) }; });
    route("POST", "/api/me/password", "any", function (c) {
      if (!verify(c.body.current || "", c.me.password)) fail(400, "Your current password is incorrect");
      if (typeof c.body.password !== "string" || c.body.password.length < 8) fail(400, "New password must be at least 8 characters");
      c.me.password = hash(c.body.password);
      return { ok: true };
    });
    route("GET", "/api/doctors", "any", function (c) {
      return c.db.users.filter(function (u) { return u.role === "doctor" && u.active; }).map(function (u) { return { id: u.id, name: u.name, specialty: u.specialty || "", qualification: u.qualification || "" }; });
    });
    route("GET", "/api/settings", "any", function (c) { return c.db.settings; });
    route("GET", "/api/clinic", null, function (c) { var s = c.db.settings; return { clinicName: s.clinicName, tagline: s.tagline, phone: s.phone, timings: s.timings }; });
    route("PUT", "/api/settings", ["admin"], function (c) {
      ["clinicName", "tagline", "address", "phone", "email", "timings", "rxNote"].forEach(function (k) { if (c.body[k] !== undefined) c.db.settings[k] = str(c.body[k], k === "rxNote" || k === "address" ? 400 : 160); });
      if (c.body.openTime !== undefined) { if (!TIME_RE.test(c.body.openTime)) fail(400, "Invalid opening time"); c.db.settings.openTime = c.body.openTime; }
      if (c.body.closeTime !== undefined) { if (!TIME_RE.test(c.body.closeTime)) fail(400, "Invalid closing time"); c.db.settings.closeTime = c.body.closeTime; }
      if (c.db.settings.openTime && c.db.settings.closeTime && c.db.settings.openTime >= c.db.settings.closeTime) fail(400, "Closing time must be after opening time");
      if (c.body.slotMinutes !== undefined) c.db.settings.slotMinutes = num(c.body.slotMinutes, 5, 120, "slot length") || 15;
      if (c.body.consultFee !== undefined) c.db.settings.consultFee = num(c.body.consultFee, 0, 100000, "consultation fee") || 0;
      if (!c.db.settings.clinicName) fail(400, "Clinic name is required");
      return c.db.settings;
    });

    // ---- admin ----
    route("GET", "/api/stats", ["admin"], function (c) {
      var db = c.db, t = today(), revenue7 = [];
      for (var i = 6; i >= 0; i--) {
        var d = dayOffset(-i);
        revenue7.push({ date: d, amount: db.invoices.filter(function (x) { return x.date === d && x.status === "paid"; }).reduce(function (s, x) { return s + x.total; }, 0) });
      }
      var todayAppts = db.appointments.filter(function (a) { return a.date === t; });
      var byStatus = {}; todayAppts.forEach(function (a) { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
      var byRole = {}; db.users.forEach(function (u) { byRole[u.role] = (byRole[u.role] || 0) + 1; });
      return {
        users: db.users.length, usersByRole: byRole, patients: db.patients.length,
        todayAppointments: todayAppts.filter(function (a) { return a.status !== "cancelled"; }).length, todayByStatus: byStatus,
        revenuePaid: db.invoices.filter(function (x) { return x.status === "paid"; }).reduce(function (s, x) { return s + x.total; }, 0),
        revenueDue: db.invoices.filter(function (x) { return x.status !== "paid"; }).reduce(function (s, x) { return s + x.total; }, 0),
        prescriptions: db.prescriptions.length, newLeads: db.leads.filter(function (l) { return l.status === "new"; }).length, revenue7: revenue7,
      };
    });
    route("GET", "/api/users", ["admin"], function (c) { return c.db.users.map(pub); });
    function userFields(db, u, body, me, isNew) {
      if (isNew || body.name !== undefined) u.name = need(body.name, "Name", 80);
      if (isNew || body.email !== undefined) {
        var e = need(body.email, "Email", 120).toLowerCase();
        if (!EMAIL_RE.test(e)) fail(400, "Please enter a valid email");
        if (db.users.some(function (x) { return x.email === e && x.id !== u.id; })) fail(409, "A user with this email already exists");
        u.email = e;
      }
      if (isNew || body.role !== undefined) {
        if (ROLES.indexOf(body.role) < 0) fail(400, "Please choose a valid role");
        if (me && u.id === me.id && body.role !== "admin") fail(400, "You can't remove your own admin role");
        u.role = body.role;
      }
      if (body.active !== undefined && !isNew) {
        var active = bool(body.active);
        if (me && u.id === me.id && !active) fail(400, "You can't deactivate your own account");
        u.active = active;
      }
      if (body.phone !== undefined) { var ph = cleanPhone(body.phone); if (ph && !PHONE_RE.test(ph)) fail(400, "Please enter a valid 10-digit mobile number"); u.phone = ph; }
      ["specialty", "qualification", "regNo"].forEach(function (k) { if (body[k] !== undefined) u[k] = u.role === "doctor" ? str(body[k], 80) : ""; });
      if (isNew || body.password) {
        if (typeof body.password !== "string" || body.password.length < 8) fail(400, "Password must be at least 8 characters");
        u.password = hash(body.password);
      }
      if (u.role === "patient" && !u.patientId) {
        var p = newPatient(db, { name: u.name, phone: u.phone });
        u.patientId = p.id;
      }
    }
    route("POST", "/api/users", ["admin"], function (c) {
      var u = { id: newId("u"), active: true, createdAt: nowIso() };
      userFields(c.db, u, c.body, c.me, true);
      c.db.users.push(u);
      return pub(u);
    });
    route("PUT", "/api/users/:id", ["admin"], function (c) {
      var u = findOr404(c.db.users, c.params.id, "User");
      userFields(c.db, u, c.body, c.me, false);
      c.changedUser = u.id;
      return pub(u);
    });
    route("DELETE", "/api/users/:id", ["admin"], function (c) {
      if (c.params.id === c.me.id) fail(400, "You can't delete your own account");
      var i = c.db.users.findIndex(function (x) { return x.id === c.params.id; });
      if (i < 0) fail(404, "User not found");
      c.db.users.splice(i, 1); c.changedUser = c.params.id;
      return { ok: true };
    });

    // ---- patients (general data: reception only) ----
    function patientFields(p, body, isNew) {
      if (isNew || body.name !== undefined) p.name = need(body.name, "Patient name", 80);
      if (body.age !== undefined) p.age = num(body.age, 0, 130, "age");
      if (body.gender !== undefined) p.gender = ["Male", "Female", "Other"].indexOf(body.gender) >= 0 ? body.gender : "";
      if (body.phone !== undefined) { var ph = cleanPhone(body.phone); if (ph && !PHONE_RE.test(ph)) fail(400, "Please enter a valid 10-digit mobile number"); p.phone = ph; }
      if (body.email !== undefined) { var e = str(body.email, 120).toLowerCase(); if (e && !EMAIL_RE.test(e)) fail(400, "Please enter a valid email"); p.email = e; }
      if (body.bloodGroup !== undefined) p.bloodGroup = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].indexOf(body.bloodGroup) >= 0 ? body.bloodGroup : "";
      ["address"].forEach(function (k) { if (body[k] !== undefined) p[k] = str(body[k], 240); });
      ["city", "abha", "emergencyContact", "allergies"].forEach(function (k) { if (body[k] !== undefined) p[k] = str(body[k], 120); });
    }
    function newPatient(db, body) {
      db.counters = db.counters || { uhid: 25000, invoice: 1000, rx: 3000 };
      var p = { id: newId("p"), uhid: String(++db.counters.uhid), name: "", age: null, gender: "", phone: "", email: "", address: "", city: "", bloodGroup: "", abha: "", emergencyContact: "", allergies: "", createdAt: nowIso() };
      patientFields(p, body, true);
      db.patients.push(p);
      return p;
    }
    route("GET", "/api/patients", VIEW_PATIENTS, function (c) { return c.db.patients.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }); });
    route("POST", "/api/patients", ["reception"], function (c) { return newPatient(c.db, c.body); });
    route("PUT", "/api/patients/:id", ["reception"], function (c) { var p = findOr404(c.db.patients, c.params.id, "Patient"); patientFields(p, c.body, false); return p; });
    route("GET", "/api/patients/:id", "any", function (c) {
      var me = c.me, db = c.db;
      if (VIEW_PATIENTS.indexOf(me.role) < 0 && !ownPatient(me, c.params.id)) fail(403, "You don't have access to this patient");
      var p = findOr404(db.patients, c.params.id, "Patient");
      var mine = function (x) { return x.patientId === p.id; };
      var nm = function (x) { return names(db, x); };
      var r = me.role;
      return Object.assign({}, p, {
        appointments: db.appointments.filter(mine).sort(byDateDesc).map(nm),
        vitals: ["admin", "doctor", "nurse", "patient"].indexOf(r) >= 0 ? db.vitals.filter(mine).sort(byDateDesc).map(nm) : [],
        prescriptions: ["admin", "doctor", "pharmacy", "patient"].indexOf(r) >= 0 ? db.prescriptions.filter(mine).sort(byDateDesc).map(nm) : [],
        invoices: ["admin", "reception", "patient"].indexOf(r) >= 0 ? db.invoices.filter(mine).sort(byDateDesc).map(nm) : [],
      });
    });

    // ---- appointments ----
    route("GET", "/api/appointments", ["admin", "doctor", "nurse", "reception", "patient"], function (c) {
      var me = c.me, list = c.db.appointments;
      if (me.role === "doctor") list = list.filter(function (a) { return a.doctorId === me.id; });
      if (me.role === "patient") list = list.filter(function (a) { return a.patientId === me.patientId; });
      if (c.query.date) list = list.filter(function (a) { return a.date === c.query.date; });
      return list.slice().sort(byDateAsc).map(function (a) { return names(c.db, a); });
    });
    route("POST", "/api/appointments", ["reception", "patient"], function (c) {
      var me = c.me, db = c.db;
      var patientId = me.role === "patient" ? me.patientId : need(c.body.patientId, "Patient");
      findOr404(db.patients, patientId, "Patient");
      var doctor = db.users.filter(function (u) { return u.id === c.body.doctorId && u.role === "doctor" && u.active; })[0] || fail(400, "Please choose a doctor");
      var date = need(c.body.date, "Date", 10), time = need(c.body.time, "Time", 5);
      if (!DATE_RE.test(date) || !TIME_RE.test(time)) fail(400, "Please enter a valid date and time");
      if (date < today()) fail(400, "Appointments can't be booked in the past");
      var st = db.settings || {};
      if (st.openTime && st.closeTime && (time < st.openTime || time >= st.closeTime)) fail(400, "The clinic is open " + (st.timings || st.openTime + " to " + st.closeTime) + ". Please pick a time in that window.");
      var closedDays = Array.isArray(st.closedDays) ? st.closedDays : [];
      if (closedDays.indexOf(new Date(date + "T12:00:00").getDay()) >= 0) fail(400, "The clinic is closed on that day. Please pick another date.");
      if (date === today() && time <= hm(new Date())) fail(400, "That time has already passed today. Please pick a later time or another day.");
      if (db.appointments.some(function (a) { return a.doctorId === doctor.id && a.date === date && a.time === time && ["cancelled", "no-show"].indexOf(a.status) < 0; }))
        fail(409, "That slot is already taken. Please pick another time.");
      var a = { id: newId("a"), patientId: patientId, doctorId: doctor.id, date: date, time: time, type: c.body.type === "Video" ? "Video" : "In-clinic", reason: str(c.body.reason, 200), status: me.role === "patient" ? "requested" : "booked", vitalsDone: false, createdAt: nowIso() };
      db.appointments.push(a);
      return names(db, a);
    });
    route("PUT", "/api/appointments/:id", ["reception", "doctor", "patient"], function (c) {
      var me = c.me, a = findOr404(c.db.appointments, c.params.id, "Appointment"), b = c.body;
      if (me.role === "patient") {
        if (a.patientId !== me.patientId) fail(403, "Not your appointment");
        if (b.status !== "cancelled" || ["requested", "booked"].indexOf(a.status) < 0) fail(400, "You can only cancel upcoming appointments");
        a.status = "cancelled";
      } else if (me.role === "doctor") {
        if (a.doctorId !== me.id) fail(403, "This appointment belongs to another doctor");
        if (["completed", "no-show"].indexOf(b.status) < 0) fail(403, "Doctors can only mark a visit as completed or no-show");
        a.status = b.status;
      } else {
        if (b.status !== undefined) { if (APPT_STATUS.indexOf(b.status) < 0) fail(400, "Invalid status"); a.status = b.status; }
        if (b.date !== undefined) { if (!DATE_RE.test(b.date)) fail(400, "Invalid date"); a.date = b.date; }
        if (b.time !== undefined) { if (!TIME_RE.test(b.time)) fail(400, "Invalid time"); a.time = b.time; }
      }
      a.updatedAt = nowIso();
      return names(c.db, a);
    });

    // ---- vitals (nurse records; doctor/admin view) ----
    function vitalsFields(v, b) {
      v.bpSys = num(b.bpSys, 50, 260, "systolic BP"); v.bpDia = num(b.bpDia, 30, 160, "diastolic BP");
      if ((v.bpSys == null) !== (v.bpDia == null)) fail(400, "Enter both systolic and diastolic BP");
      v.pulse = num(b.pulse, 20, 250, "pulse"); v.temp = num(b.temp, 90, 110, "temperature (\u00b0F)");
      v.spo2 = num(b.spo2, 50, 100, "SpO2"); v.resp = num(b.resp, 5, 80, "respiratory rate");
      v.height = num(b.height, 30, 250, "height (cm)"); v.weight = num(b.weight, 1, 350, "weight (kg)");
      v.bmi = v.height && v.weight ? Math.round(v.weight / Math.pow(v.height / 100, 2) * 100) / 100 : null;
      v.sugar = num(b.sugar, 20, 800, "blood sugar"); v.sugarType = ["RBS", "FBS", "PPBS"].indexOf(b.sugarType) >= 0 ? b.sugarType : "RBS";
      v.notes = str(b.notes, 500);
      if ([v.bpSys, v.pulse, v.temp, v.spo2, v.resp, v.height, v.weight, v.sugar].every(function (x) { return x == null; })) fail(400, "Enter at least one reading");
    }
    route("GET", "/api/vitals", ["admin", "doctor", "nurse", "patient"], function (c) {
      var list = c.db.vitals;
      if (c.me.role === "patient") list = list.filter(function (v) { return v.patientId === c.me.patientId; });
      if (c.query.patientId) list = list.filter(function (v) { return v.patientId === c.query.patientId; });
      if (c.query.date) list = list.filter(function (v) { return v.date === c.query.date; });
      return list.slice().sort(byDateDesc).map(function (v) { return names(c.db, v); });
    });
    route("POST", "/api/vitals", ["nurse"], function (c) {
      var db = c.db, b = c.body;
      var patientId = need(b.patientId, "Patient"); findOr404(db.patients, patientId, "Patient");
      var d = new Date();
      var v = { id: newId("v"), patientId: patientId, appointmentId: str(b.appointmentId, 40), date: ymd(d), time: hm(d), recordedBy: c.me.id, createdAt: nowIso() };
      vitalsFields(v, b);
      db.vitals.push(v);
      var a = v.appointmentId && db.appointments.filter(function (x) { return x.id === v.appointmentId; })[0];
      if (a) a.vitalsDone = true;
      return names(db, v);
    });
    route("PUT", "/api/vitals/:id", ["nurse"], function (c) {
      var v = findOr404(c.db.vitals, c.params.id, "Vitals record");
      vitalsFields(v, c.body); v.recordedBy = c.me.id; v.updatedAt = nowIso();
      return names(c.db, v);
    });

    // ---- prescriptions (doctor writes) ----
    route("GET", "/api/prescriptions", ["admin", "doctor", "pharmacy", "patient"], function (c) {
      var me = c.me, list = c.db.prescriptions;
      if (c.query.date) list = list.filter(function (r) { return r.date === c.query.date; });
      if (me.role === "patient") list = list.filter(function (r) { return r.patientId === me.patientId; });
      else if (c.query.patientId) list = list.filter(function (r) { return r.patientId === c.query.patientId; });
      else if (me.role === "doctor") list = list.filter(function (r) { return r.doctorId === me.id; });
      return list.slice().sort(byDateDesc).map(function (r) { return names(c.db, r); });
    });
    route("POST", "/api/prescriptions", ["doctor"], function (c) {
      var db = c.db, b = c.body, me = c.me;
      var patientId = need(b.patientId, "Patient"); findOr404(db.patients, patientId, "Patient");
      var meds = (Array.isArray(b.medicines) ? b.medicines : []).map(function (m) {
        m = m || {};
        return { name: str(m.name, 100), composition: str(m.composition, 140), dosage: str(m.dosage, 40), timing: str(m.timing, 40), frequency: str(m.frequency, 40), duration: str(m.duration, 40), notes: str(m.notes, 200) };
      }).filter(function (m) { return m.name; }).slice(0, 25);
      if (!meds.length) fail(400, "Add at least one medicine");
      var followUp = str(b.followUp, 10); if (followUp && !DATE_RE.test(followUp)) fail(400, "Invalid follow-up date");
      var appointmentId = str(b.appointmentId, 40);
      var appt = appointmentId && db.appointments.filter(function (x) { return x.id === appointmentId; })[0];
      if (appt && appt.doctorId !== me.id) fail(403, "This appointment belongs to another doctor");
      var t = today();
      var v = db.vitals.filter(function (x) { return x.patientId === patientId && (appointmentId ? x.appointmentId === appointmentId : x.date === t); }).sort(byDateDesc)[0] || null;
      db.counters = db.counters || { uhid: 25000, invoice: 1000, rx: 3000 };
      var d = new Date();
      var rx = {
        id: newId("rx"), number: "RX-" + (++db.counters.rx), patientId: patientId, doctorId: me.id, appointmentId: appointmentId, date: ymd(d), time: hm(d), vitals: v ? clone(v) : null,
        complaints: str(b.complaints, 1000), examination: str(b.examination, 1000), diagnosis: str(b.diagnosis, 300), diet: str(b.diet, 500),
        medicines: meds, advice: str(b.advice, 1500), tests: str(b.tests, 400), testsAfter: str(b.testsAfter, 40), followUp: followUp, createdAt: nowIso(),
      };
      db.prescriptions.push(rx);
      if (appt) appt.status = "completed";
      return names(db, rx);
    });

    // ---- receipts (reception) ----
    route("GET", "/api/invoices", ["admin", "reception", "patient"], function (c) {
      var list = c.db.invoices;
      if (c.me.role === "patient") list = list.filter(function (i) { return i.patientId === c.me.patientId; });
      return list.slice().sort(byDateDesc).map(function (i) { return names(c.db, i); });
    });
    route("POST", "/api/invoices", ["reception"], function (c) {
      var db = c.db, b = c.body;
      var patientId = need(b.patientId, "Patient"); findOr404(db.patients, patientId, "Patient");
      var items = (Array.isArray(b.items) ? b.items : []).map(function (i) { i = i || {}; return { description: str(i.description, 100), amount: Math.round(Number(i.amount) * 100) / 100 }; })
        .filter(function (i) { return i.description && isFinite(i.amount) && i.amount > 0; }).slice(0, 30);
      if (!items.length) fail(400, "Add at least one item with an amount");
      var sub = items.reduce(function (s, i) { return s + i.amount; }, 0);
      var discount = num(b.discount, 0, sub, "discount") || 0;
      db.counters = db.counters || { uhid: 25000, invoice: 1000, rx: 3000 };
      var d = new Date();
      // receipt numbers start with the clinic's initials, e.g. Skin Shine -> SS-1013
      var prefix = String((db.settings && db.settings.clinicName) || "LH").split(/\s+/).map(function (w) { return w.charAt(0); }).join("").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3) || "LH";
      var inv = { id: newId("inv"), number: prefix + "-" + (++db.counters.invoice), patientId: patientId, date: ymd(d), time: hm(d), items: items, discount: discount, total: sub - discount, status: b.status === "paid" ? "paid" : "unpaid", mode: b.status === "paid" ? str(b.mode, 20) : "", receivedBy: c.me.id, paidAt: b.status === "paid" ? nowIso() : "", createdAt: nowIso() };
      db.invoices.push(inv);
      return names(db, inv);
    });
    route("PUT", "/api/invoices/:id", ["reception"], function (c) {
      var inv = findOr404(c.db.invoices, c.params.id, "Receipt");
      if (c.body.status !== undefined) { var was = inv.status; inv.status = c.body.status === "paid" ? "paid" : "unpaid"; if (inv.status === "paid" && was !== "paid") inv.paidAt = nowIso(); if (inv.status !== "paid") inv.paidAt = ""; }
      if (c.body.mode !== undefined) inv.mode = str(c.body.mode, 20);
      inv.receivedBy = c.me.id;
      return names(c.db, inv);
    });

    // ---- report for the Excel sheet (patients, payments, visits) ----
    route("GET", "/api/report", ["admin", "reception"], function (c) {
      var db = c.db;
      var byPatient = {};
      db.patients.forEach(function (p) { byPatient[p.id] = { billed: 0, paid: 0, due: 0, visits: 0, lastVisit: "", lastPayment: "" }; });
      db.invoices.forEach(function (i) { var s = byPatient[i.patientId]; if (!s) return; s.billed += i.total; if (i.status === "paid") { s.paid += i.total; var d = (i.paidAt || i.date).slice(0, 10); if (d > s.lastPayment) s.lastPayment = d; } else s.due += i.total; });
      db.appointments.forEach(function (a) { var s = byPatient[a.patientId]; if (!s || a.status !== "completed") return; s.visits++; if (a.date > s.lastVisit) s.lastVisit = a.date; });
      var patients = db.patients.slice().sort(function (a, b) { return a.uhid.localeCompare(b.uhid); }).map(function (p) {
        var s = byPatient[p.id];
        return { uhid: p.uhid, name: p.name, age: p.age, gender: p.gender, phone: p.phone, city: p.city, registered: (p.createdAt || "").slice(0, 10), visits: s.visits, lastVisit: s.lastVisit, billed: s.billed, paid: s.paid, due: s.due, lastPayment: s.lastPayment };
      });
      var payments = db.invoices.slice().sort(byDateDesc).map(function (i) {
        var o = names(db, i), pt = db.patients.filter(function (p) { return p.id === i.patientId; })[0] || {};
        return { date: i.date, time: i.time, number: i.number, uhid: o.patientUhid, name: o.patientName, phone: pt.phone || "", services: i.items.map(function (x) { return x.description; }).join(", "), amount: i.items.reduce(function (s, x) { return s + x.amount; }, 0), discount: i.discount || 0, total: i.total, mode: i.mode || "", status: i.status, paidAt: i.paidAt || "", receivedBy: o.receivedByName || "" };
      });
      var visits = db.appointments.slice().sort(byDateDesc).map(function (a) { var o = names(db, a); return { date: a.date, time: a.time, uhid: o.patientUhid, name: o.patientName, doctor: o.doctorName, type: a.type, reason: a.reason, status: a.status }; });
      return { generatedAt: nowIso(), clinicName: db.settings.clinicName, patients: patients, payments: payments, visits: visits };
    });

    // ---- pharmacy stock & expiry (like the clinic's Excel sheet) ----
    var EXPIRING_DAYS = 90;
    var stock = function (db) { if (!Array.isArray(db.inventory)) db.inventory = []; if (!Array.isArray(db.stockLog)) db.stockLog = []; return db.inventory; };
    function stockView(i) {
      var days = Math.round((Date.parse(i.expiry + "T00:00:00") - Date.parse(today() + "T00:00:00")) / 864e5);
      var low = i.qty <= i.minQty;
      var status = days < 0 ? "expired" : days <= EXPIRING_DAYS ? "expiring" : low ? "low" : "ok"; // same priority as the sheet colours
      return Object.assign({}, i, { stockValue: Math.round(i.qty * i.purchaseRate * 100) / 100, mrpValue: Math.round(i.qty * i.mrp * 100) / 100, daysToExpiry: days, lowStock: low, status: status });
    }
    function stockFields(item, b, isNew) {
      if (isNew || b.name !== undefined) item.name = need(b.name, "Medicine name", 100);
      if (b.barcode !== undefined) { var bc = str(b.barcode, 64).replace(/\s+/g, ""); if (bc && !/^[0-9A-Za-z\-]{3,64}$/.test(bc)) fail(400, "Barcode can only contain letters, numbers and dashes"); item.barcode = bc; }
      if (isNew || b.company !== undefined) item.company = str(b.company, 80);
      if (isNew || b.batch !== undefined) item.batch = need(b.batch, "Batch number", 40).toUpperCase();
      if (isNew || b.expiry !== undefined) { var e = str(b.expiry, 10); if (!DATE_RE.test(e) || isNaN(Date.parse(e))) fail(400, "Please choose a valid expiry month and year"); item.expiry = e; }
      if (isNew || b.mrp !== undefined) item.mrp = num(b.mrp, 0, 1000000, "MRP") || 0;
      if (isNew || b.purchaseRate !== undefined) item.purchaseRate = num(b.purchaseRate, 0, 1000000, "purchase rate") || 0;
      if (isNew || b.qty !== undefined) { var q = num(b.qty, 0, 1000000, "quantity"); item.qty = Math.round(q || 0); }
      if (isNew || b.minQty !== undefined) { var m = num(b.minQty, 0, 1000000, "minimum quantity"); item.minQty = Math.round(m || 0); }
    }
    function stockSummary(list) {
      var v = list.map(stockView);
      return {
        items: v.length, totalQty: v.reduce(function (a, i) { return a + i.qty; }, 0),
        stockValue: Math.round(v.reduce(function (a, i) { return a + i.stockValue; }, 0) * 100) / 100,
        mrpValue: Math.round(v.reduce(function (a, i) { return a + i.mrpValue; }, 0) * 100) / 100,
        expired: v.filter(function (i) { return i.status === "expired"; }).length,
        expiring: v.filter(function (i) { return i.status === "expiring"; }).length,
        lowStock: v.filter(function (i) { return i.lowStock && i.status !== "expired"; }).length,
      };
    }
    var dupBatch = function (db, item, exceptId) { return item.barcode && stock(db).some(function (x) { return x.id !== exceptId && x.barcode === item.barcode && x.batch === item.batch; }); };
    route("GET", "/api/inventory", ["admin", "pharmacy"], function (c) {
      var list = stock(c.db).map(stockView);
      if (c.query.barcode) list = list.filter(function (i) { return i.barcode === str(c.query.barcode, 64); });
      return list.sort(function (a, b) { return a.name.localeCompare(b.name) || a.expiry.localeCompare(b.expiry); });
    });
    route("GET", "/api/inventory/summary", ["admin", "pharmacy"], function (c) { return stockSummary(stock(c.db)); });
    // what the doctor sees while prescribing: usable (not expired) quantity per medicine name, no prices
    route("GET", "/api/inventory/availability", ["admin", "pharmacy", "doctor", "nurse"], function (c) {
      var map = {};
      stock(c.db).map(stockView).forEach(function (i) {
        var k = i.name.toLowerCase().replace(/\s+/g, " ").trim();
        var m = map[k] || (map[k] = { name: i.name, qty: 0, minQty: 0, expiredQty: 0, nextExpiry: "" });
        if (i.status === "expired") { m.expiredQty += i.qty; return; }
        m.qty += i.qty; m.minQty += i.minQty;
        if (i.qty > 0 && (!m.nextExpiry || i.expiry < m.nextExpiry)) m.nextExpiry = i.expiry;
      });
      return Object.keys(map).map(function (k) { var m = map[k]; m.status = m.qty <= 0 ? "out" : m.qty <= m.minQty ? "low" : "in"; return m; });
    });
    route("GET", "/api/inventory/log", ["admin", "pharmacy"], function (c) {
      var db = c.db; stock(db);
      return db.stockLog.slice(-300).reverse().map(function (l) { return Object.assign({}, l, { byName: (db.users.filter(function (u) { return u.id === l.by; })[0] || {}).name || "" }); });
    });
    route("POST", "/api/inventory", ["pharmacy"], function (c) {
      var db = c.db, item = { id: newId("st"), createdAt: nowIso(), updatedAt: nowIso() };
      stockFields(item, c.body, true);
      if (dupBatch(db, item)) fail(409, "This barcode and batch is already in stock. Use + Stock to add quantity.");
      stock(db).push(item);
      db.stockLog.push({ id: newId("sl"), itemId: item.id, name: item.name, batch: item.batch, change: item.qty, reason: "Added to stock", note: "", by: c.me.id, at: nowIso() });
      return stockView(item);
    });
    route("PUT", "/api/inventory/:id", ["pharmacy"], function (c) {
      var db = c.db, item = findOr404(stock(db), c.params.id, "Stock item"), before = item.qty;
      var copy = Object.assign({}, item); stockFields(copy, c.body, false);
      if (dupBatch(db, copy, item.id)) fail(409, "Another entry already has this barcode and batch.");
      Object.assign(item, copy, { updatedAt: nowIso() });
      if (item.qty !== before) db.stockLog.push({ id: newId("sl"), itemId: item.id, name: item.name, batch: item.batch, change: item.qty - before, reason: "Corrected", note: "", by: c.me.id, at: nowIso() });
      return stockView(item);
    });
    // record a sale / dispense (negative) or stock received (positive)
    route("POST", "/api/inventory/:id/adjust", ["pharmacy"], function (c) {
      var db = c.db, item = findOr404(stock(db), c.params.id, "Stock item");
      var change = Math.round(Number(c.body.change));
      if (!isFinite(change) || change === 0 || Math.abs(change) > 100000) fail(400, "Please enter a quantity");
      if (change < 0 && stockView(item).status === "expired") fail(400, "This batch has expired. Expired medicine can't be sold. Remove it from stock instead.");
      if (item.qty + change < 0) fail(400, "Only " + item.qty + " in stock for this batch.");
      item.qty += change; item.updatedAt = nowIso();
      var reasons = ["Sold / dispensed", "Stock received", "Damaged", "Returned to supplier", "Expired - removed", "Correction"];
      db.stockLog.push({ id: newId("sl"), itemId: item.id, name: item.name, batch: item.batch, change: change, reason: reasons.indexOf(c.body.reason) >= 0 ? c.body.reason : (change < 0 ? "Sold / dispensed" : "Stock received"), note: str(c.body.note, 200), by: c.me.id, at: nowIso() });
      return stockView(item);
    });
    route("DELETE", "/api/inventory/:id", ["pharmacy"], function (c) {
      var db = c.db, list = stock(db), i = list.findIndex(function (x) { return x.id === c.params.id; });
      if (i < 0) fail(404, "Stock item not found");
      var item = list[i]; list.splice(i, 1);
      db.stockLog.push({ id: newId("sl"), itemId: item.id, name: item.name, batch: item.batch, change: -item.qty, reason: "Deleted from stock", note: "", by: c.me.id, at: nowIso() });
      return { ok: true };
    });
    // import rows from the clinic's Excel sheet (skips duplicates and bad rows, reports each problem)
    route("POST", "/api/inventory/import", ["pharmacy"], function (c) {
      var db = c.db, rows = Array.isArray(c.body.rows) ? c.body.rows.slice(0, 5000) : [], added = 0, skipped = 0, errors = [];
      rows.forEach(function (r, k) {
        try {
          var item = { id: newId("st"), createdAt: nowIso(), updatedAt: nowIso() };
          stockFields(item, r || {}, true);
          if (dupBatch(db, item)) { skipped++; return; }
          stock(db).push(item); added++;
          db.stockLog.push({ id: newId("sl"), itemId: item.id, name: item.name, batch: item.batch, change: item.qty, reason: "Imported from Excel", note: "", by: c.me.id, at: nowIso() });
        } catch (e) { if (errors.length < 50) errors.push({ row: (r && r._row) || k + 2, error: e.message }); }
      });
      return { added: added, skipped: skipped, failed: rows.length - added - skipped, errors: errors };
    });

    // ---- website leads ----
    route("POST", "/api/leads", null, function (c) {
      var b = c.body;
      // appointment requests from the clinic website need a phone number; email is optional for them
      var email = str(b.email, 120).toLowerCase();
      if (b.type === "appointment") { if (!PHONE_RE.test(cleanPhone(b.phone))) fail(400, "Please enter a valid 10-digit mobile number"); if (email && !EMAIL_RE.test(email)) fail(400, "Please enter a valid email"); }
      else { email = need(b.email, "Email", 120).toLowerCase(); if (!EMAIL_RE.test(email)) fail(400, "Please enter a valid email"); }
      c.db.leads.push({ id: newId("l"), type: ["contact", "appointment"].indexOf(b.type) >= 0 ? b.type : "demo", concern: str(b.concern, 80), preferredDate: DATE_RE.test(str(b.preferredDate, 10)) && str(b.preferredDate, 10) >= today() ? str(b.preferredDate, 10) : "", name: need(b.name, "Name", 80), email: email, phone: cleanPhone(b.phone), specialty: str(b.specialty, 60), city: str(b.city, 60), organisation: str(b.organisation, 60), topic: str(b.topic, 60), message: str(b.message, 2000), page: str(b.page, 40), status: "new", createdAt: nowIso() });
      return { ok: true };
    });
    route("GET", "/api/leads", ["admin"], function (c) { return c.db.leads.slice().sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); }); });
    route("PUT", "/api/leads/:id", ["admin"], function (c) {
      var l = findOr404(c.db.leads, c.params.id, "Lead");
      if (["new", "contacted", "converted", "closed"].indexOf(c.body.status) >= 0) l.status = c.body.status;
      return l;
    });
    route("DELETE", "/api/leads/:id", ["admin"], function (c) {
      var i = c.db.leads.findIndex(function (x) { return x.id === c.params.id; });
      if (i < 0) fail(404, "Lead not found");
      c.db.leads.splice(i, 1);
      return { ok: true };
    });

    /* ---------------- entry points ---------------- */
    function login(db, email, password) {
      var user = db.users.filter(function (u) { return u.email === str(email, 120).toLowerCase(); })[0];
      if (!user || !verify(password || "", user.password)) fail(401, "Incorrect email or password");
      if (!user.active) fail(403, "This account has been deactivated. Please contact your administrator.");
      user.lastLogin = nowIso();
      return user;
    }
    // Returns { data, changedUser } \u2014 throws errors with .status
    function handle(db, me, method, path, body, query) {
      var r = routes.filter(function (x) { return x.method === method && x.re.test(path); })[0];
      if (!r) fail(404, "Not found");
      if (r.roles) {
        if (!me) fail(401, "Please log in");
        if (r.roles !== "any" && r.roles.indexOf(me.role) < 0) fail(403, "Your role doesn't have permission to do this");
      }
      var m = path.match(r.re), params = {};
      r.keys.forEach(function (k, i) { params[k] = decodeURIComponent(m[i + 1]); });
      var ctx = { db: db, me: me, params: params, body: body || {}, query: query || {} };
      var data = r.fn(ctx);
      return { data: data, changedUser: ctx.changedUser };
    }
    return { seed: seed, login: login, handle: handle, pub: pub };
  }

  /* =================== Browser client (server or demo mode) =================== */
  function client() {
    if (typeof window === "undefined") throw new Error("client() is browser-only");
    var DB_KEY = "lumina-demo-db-v5", SESSION_KEY = "lumina-demo-session";
    var modeP = null, core = null;
    function cyrb(s) { var h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (var i = 0; i < s.length; i++) { var ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16); }
    function rand(n) { var a = new Uint8Array(n); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, "0"); }).join(""); }
    function getCore() {
      if (!core) core = create({
        rand: rand,
        // Demo mode only: data lives in this browser, so this is a light hash, not real security.
        hash: function (pw) { var s = rand(8); return "demo:" + s + ":" + cyrb(s + pw); },
        verify: function (pw, stored) { var p = String(stored || "").split(":"); return p.length === 3 && cyrb(p[1] + pw) === p[2]; },
      });
      return core;
    }
    function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
    var memDb = null, memSession = null; // fallback when storage is blocked
    function loadDb() { var raw = store(DB_KEY); if (raw) { try { return JSON.parse(raw); } catch (e) { } } if (memDb) return memDb; var db = getCore().seed(window.LUMINA_PROFILE); saveDb(db); return db; }
    function saveDb(db) { memDb = db; store(DB_KEY, JSON.stringify(db)); }
    function detect() {
      if (location.protocol.indexOf("http") !== 0) return Promise.resolve("demo");
      return fetch("/api/health", { cache: "no-store", credentials: "same-origin" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { return d && d.lumina ? "server" : "demo"; })
        .catch(function () { return "demo"; });
    }
    function mode() { if (!modeP) modeP = detect(); return modeP; }
    function serverRequest(method, url, body) {
      var o = { method: method, credentials: "same-origin", headers: {} };
      if (method !== "GET") { o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(body || {}); }
      return fetch(url, o).then(function (r) {
        return r.text().then(function (t) {
          var d; try { d = t ? JSON.parse(t) : {}; } catch (e) { throw HttpError(502, "The server sent an unexpected response. Please restart start.bat."); }
          if (!r.ok) throw HttpError(r.status, d.error || "Something went wrong");
          return d;
        });
      });
    }
    function demoRequest(method, url, body) {
      return new Promise(function (resolve) { setTimeout(resolve, 120); }).then(function () {
        var u = new URL(url, location.href), path = u.pathname.replace(/^.*?(\/api\/)/, "/api/"), query = {};
        u.searchParams.forEach(function (v, k) { query[k] = v; });
        var db = loadDb(), c = getCore();
        var sid = store(SESSION_KEY) || memSession;
        var me = sid ? db.users.filter(function (x) { return x.id === sid && x.active; })[0] || null : null;
        if (path === "/api/health") return { ok: true, lumina: true, mode: "demo" };
        if (path === "/api/login" && method === "POST") {
          var user = c.login(db, body.email, body.password); saveDb(db);
          memSession = user.id; store(SESSION_KEY, user.id);
          return { user: c.pub(user) };
        }
        if (path === "/api/logout") { memSession = null; store(SESSION_KEY, null); return { ok: true }; }
        var out = c.handle(db, me, method, path, clone(body || {}), query);
        if (method !== "GET") saveDb(db);
        return clone(out.data);
      });
    }
    return {
      mode: mode,
      request: function (method, url, body) { return mode().then(function (m) { return m === "server" ? serverRequest(method, url, body) : demoRequest(method, url, body); }); },
      resetDemo: function () { store(DB_KEY, null); store(SESSION_KEY, null); memDb = null; memSession = null; },
    };
  }

  return { create: create, client: client };
});
