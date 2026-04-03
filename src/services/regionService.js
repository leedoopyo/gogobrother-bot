const { getRegion1List, getRegion2List } = require('../repositories/regionRepository');

async function listRegion1() {
  return getRegion1List();
}

async function listRegion2(region1) {
  return getRegion2List(region1);
}

module.exports = { listRegion1, listRegion2 };
