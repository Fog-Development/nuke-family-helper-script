// Lookups in the faction's OC config. No imports, so scoring.js (which uses
// these) stays loadable outside the browser for unit tests.

// Matching key for a crime or role name. Torn, the site and the weights
// source spell the same thing differently ("Muscle #1" / "Muscle 1",
// "Guardian Ángels" / "Guardian Angels"), so everything is compared with
// accents, case, spaces and punctuation removed. Must stay in step with
// OcRole::keyFor() on the site.
export function keyFor(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// The config's entry for a role of a crime, or null when the site does not
// know the crime (a newly released one) or the role.
export function findRole(config, crimeName, roleName) {
  if (!config || !Array.isArray(config.crimes)) return null;
  const crimeKey = keyFor(crimeName);
  const crime = config.crimes.find((entry) => entry.key === crimeKey);
  if (!crime) return null;
  const roleKey = keyFor(roleName);
  return (crime.roles || []).find((role) => role.key === roleKey) || null;
}
