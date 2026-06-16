/**
 * ECBS OS role definitions.
 * Matches app/helpers/roles.py on the backend.
 *
 * id            = role integer stored in user.role (DB)
 * displayName   = human-readable label shown in UI
 * minCreatorRole = minimum role allowed to CREATE a user with this role
 */
export let USER_ROLES = [
  {
    id: 1,
    displayName: 'Client User',
    minCreatorRole: 2,
  }, {
    id: 2,
    displayName: 'Client Admin',
    minCreatorRole: 9,
  }, {
    id: 3,
    displayName: 'Client Manager',
    minCreatorRole: 2,
  }, {
    id: 4,
    displayName: 'Client Finance',
    minCreatorRole: 2,
  }, {
    // Phase 1 addition — ECBS OS Engineering role
    id: 5,
    displayName: 'Engineering',
    minCreatorRole: 8,
  }, {
    // Phase 1 addition — ECBS OS Operations role
    id: 6,
    displayName: 'Operations',
    minCreatorRole: 9,
  }, {
    id: 7,
    displayName: 'Account Manager',
    minCreatorRole: 8,
  }, {
    id: 8,
    displayName: 'Platform Admin',
    minCreatorRole: 8,
  }, {
    id: 9,
    displayName: 'OEM Admin',
    minCreatorRole: 8,
  }, {
    id: 10,
    displayName: 'OEM User',
    minCreatorRole: 9,
  }, {
    id: 11,
    displayName: 'Installer',
    minCreatorRole: 8,
  }, {
    id: 12,
    displayName: 'Executive',
    minCreatorRole: 9,
  }, {
    // Phase 1 addition — ECBS OS Read Only role
    id: 13,
    displayName: 'Read Only',
    minCreatorRole: 9,
  }
];
