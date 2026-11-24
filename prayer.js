// Prayer times computed on the device from the sun's position. No network, no API keys.
// Standard astronomical formulas (same approach as the classic PrayTimes calculation).
const Prayer = (() => {
  const METHODS = {
    karachi: {name: 'Karachi · India & Pakistan', fajr: 18, isha: 18},
    mwl: {name: 'Muslim World League', fajr: 18, isha: 17},
    makkah: {name: 'Umm al-Qura · Makkah', fajr: 18.5, ishaMin: 90},
    dubai: {name: 'Dubai', fajr: 18.2, isha: 18.2},
    egypt: {name: 'Egyptian', fajr: 19.5, isha: 17.5},
    isna: {name: 'ISNA · North America', fajr: 15, isha: 15},
  };
  const CITIES = [
    {name: 'Bengaluru', lat: 12.9716, lng: 77.5946},
    {name: 'Hyderabad', lat: 17.385, lng: 78.4867},
    {name: 'Mumbai', lat: 19.076, lng: 72.8777},
    {name: 'Delhi', lat: 28.6139, lng: 77.209},
    {name: 'Chennai', lat: 13.0827, lng: 80.2707},
    {name: 'Dubai', lat: 25.2048, lng: 55.2708},
    {name: 'Makkah', lat: 21.3891, lng: 39.8579},
  ];
  const R = Math.PI / 180;
  const sin = d => Math.sin(d * R), cos = d => Math.cos(d * R), tan = d => Math.tan(d * R);
  const asin = x => Math.asin(x) / R, acos = x => Math.acos(Math.max(-1, Math.min(1, x))) / R;
  const atan2 = (y, x) => Math.atan2(y, x) / R, acot = x => Math.atan(1 / x) / R;
  const fix = (a, b) => ((a % b) + b) % b;

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function sun(jd) {
    const D = jd - 2451545.0;
    const g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
    const L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360), e = 23.439 - 0.00000036 * D;
    const RA = fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24);
    let eqt = q / 15 - RA;
    if (eqt > 12) eqt -= 24; if (eqt < -12) eqt += 24;
    return {decl: asin(sin(e) * sin(L)), eqt};
  }

  // Returns Date objects for the given calendar day at (lat, lng) in the device's time zone.
  function times(day, lat, lng, method = 'karachi', asr = 'hanafi') {
    const M = METHODS[method] || METHODS.karachi;
    const y = day.getFullYear(), mo = day.getMonth() + 1, d = day.getDate();
    const tz = -new Date(y, mo - 1, d, 12).getTimezoneOffset() / 60;
    const jd = julian(y, mo, d) - lng / (15 * 24);
    const noonAt = h => fix(12 - sun(jd + h / 24).eqt, 24);
    const angleTime = (angle, h, ccw) => {
      const {decl} = sun(jd + h / 24);
      const t = acos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
      return noonAt(h) + (ccw ? -t : t);
    };
    const asrTime = (factor, h) => {
      const {decl} = sun(jd + h / 24);
      return angleTime(-acot(factor + tan(Math.abs(lat - decl))), h);
    };
    // two passes: first from rough guesses, then refined
    let t = {fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18};
    for (let i = 0; i < 2; i++) {
      t = {
        fajr: angleTime(M.fajr, t.fajr, true),
        sunrise: angleTime(0.833, t.sunrise, true),
        dhuhr: noonAt(t.dhuhr),
        asr: asrTime(asr === 'hanafi' ? 2 : 1, t.asr),
        sunset: angleTime(0.833, t.sunset),
        isha: M.ishaMin ? 0 : angleTime(M.isha, t.isha),
      };
    }
    if (M.ishaMin) t.isha = t.sunset + M.ishaMin / 60;
    const shift = tz - lng / 15;
    const at = h => {
      const mins = Math.round((h + shift) * 60);
      return new Date(y, mo - 1, d, 0, mins);
    };
    const out = {fajr: at(t.fajr), sunrise: at(t.sunrise), dhuhr: at(t.dhuhr + 1 / 60), asr: at(t.asr), maghrib: at(t.sunset), isha: at(t.isha)};
    // Tahajjud: the last third of the night, from Maghrib to the next Fajr
    const nextFajr = new Date(out.fajr.getTime() + 864e5);
    out.lastThird = new Date(nextFajr - (nextFajr - out.maghrib) / 3);
    out.lastThirdPrev = new Date(out.lastThird.getTime() - 864e5);
    return out;
  }

  return {times, METHODS, CITIES};
})();
if (typeof module !== 'undefined') module.exports = Prayer;
