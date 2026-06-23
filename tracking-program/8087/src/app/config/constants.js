module.exports.constants = {

  DEFAULT_PAGE_SIZE: 10,

  DEVICE_TYPES: {
    'XECO_UNIT': 1
  },

  USER_ROLES: {
    'CLIENT_USER': 1,
    'CLIENT_ADMIN': 2,
    'CLIENT_MANAGER': 3,
    'ACCOUNT_MANAGER': 7,
    'XECO_USER': 4,
    'XECO_ADMIN': 8
  },

  METER_ALERT_TYPES: {
    'HIGH_DEMAND': 1,
    'GATEWAY_ERROR': 2
  },

  METER_CSV_TYPES: {
    'UNOCCUPIED_ENERGY': 1,
    '15_MINUTE': 2,
    'DETAILED_METER': 3
  },

  REPEATER_ALERT_TYPES: {
    'GATEWAY_ERROR': 1
  },

  SWITCH_ALERT_TYPES: {
    'GATEWAY_ERROR': 1
  },

  SWITCH_COMMAND_TYPES: {
    'POWER_ON': 1,
    'POWER_OFF': 2
  },

  GATEWAY_COMMAND_TYPES: {
    'POWER_ON': 1,
    'POWER_OFF': 2,
    'POWER_TEST': 3
  },

  SERVICE_PLAN_TYPES: {
    LAN: 'lan',
    CLOUD: 'cloud',
    OEM: 'OEM',
  },

  SERVICE_PLAN_NAMES: {
    'lan': "Synerex Server (LAN/VPN) + Cloud",
    'cloud': "Synerex Cloud Only",
    'oem': "Synerex Server / OEM Software"
  },

  SERVICE_PLAN_PRICES: {
    'lan': {
      server: 1,
      gateways: 17,
      meters: 40,
      switches: 5,
      repeaters: 2,
      upgrades: 'Free',
      maintenance: 'Free',
      users: 'Free (Max. 5)',
      addlUsers: 10,
      support: 85
    },
    'cloud': {
      server: 'Not Included',
      gateways: 17,
      meters: 62,
      switches: 27,
      repeaters: 5,
      upgrades: 'Free',
      maintenance: 'Free',
      users: 'Free (Max. 5)',
      addlUsers: 10,
      support: 85
    },
    'oem': {
      server: 99,
      gateways: 17,
      meters: 62,
      switches: 'Not Included',
      repeaters: 'Not Included',
      upgrades: 'Not Included',
      maintenance: 'Limited Support',
      users: 'Not Included',
      addlUsers: 'Not Included',
      support: 85
    }
  },

  CARBON_EMISSIONS_RATIO: (0.7054/1000),

};
