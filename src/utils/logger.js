function info(message, data) {
  const ts = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${ts}] INFO: ${message}`, data);
  } else {
    console.log(`[${ts}] INFO: ${message}`);
  }
}

function error(message, err) {
  const ts = new Date().toISOString();
  if (err !== undefined) {
    console.error(`[${ts}] ERROR: ${message}`, err);
  } else {
    console.error(`[${ts}] ERROR: ${message}`);
  }
}

module.exports = { info, error };
