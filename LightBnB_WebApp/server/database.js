const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require("pg");

const pool = new Pool({
  user: "vagrant",
  password: "123",
  host: "localhost",
  database: "lightbnb",
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(`SELECT * FROM users WHERE email = '${email}'`)
    .then((res) => res.rows[0])
    .catch((err) => null);
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`SELECT * FROM users WHERE id = '${id}'`)
    .then((res) => res.rows[0])
    .catch((err) => null);
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const sqlQuery = `INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3) RETURNING *;`;
  const values = [`${user.name}`, `${user.email}`, `${user.password}`];
  return pool
    .query(sqlQuery, values)
    .then((res) => res.rows[0])
    .catch((err) => null);
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const sqlQuery = `SELECT reservations.*, properties.*, avg(property_reviews.rating) AS average_rating
  FROM property_reviews
  JOIN reservationsON property_reviews.property_id = reservations.property_id
  JOIN properties ON reservations.property_id = properties.id
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY reservations.id, properties.id
  ORDER BY reservations.start_date
  LIMIT $2;`;
  const values = [`${guest_id}`, `${limit}`];
  return pool
    .query(sqlQuery, values)
    .then((res) => res.rows)
    .catch((err) => null);
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const sqlParams = [];
  let sqlQuery = `SELECT properties.*, avg(property_reviews.rating) AS average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id WHERE 1 = 1`;

  if (options.city) {
    sqlParams.push(`%${options.city}%`);
    sqlQuery += ` AND city LIKE $${sqlParams.length} `;
  }

  if (options.owner_id) {
    sqlParams.push(`%${options.owner_id}%`);
    sqlQuery += ` AND properties.owner_id = $${sqlParams.length} `;
  }

  if (options.minimum_price_per_night) {
    sqlParams.push(options.minimum_price_per_night * 100);
    sqlQuery += ` AND properties.cost_per_night >= $${sqlParams.length} `;
  }

  if (options.maximum_price_per_night) {
    sqlParams.push(options.maximum_price_per_night * 100);
    sqlQuery += ` AND properties.cost_per_night <= $${sqlParams.length} `;
  }
  if (options.minimum_rating) {
    sqlParams.push(options.minimum_rating);
    sqlQuery += ` AND property_reviews.rating >= $${sqlParams.length} `;
  }

  sqlParams.push(limit);
  sqlQuery += `GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${sqlParams.length};`;

  return pool
    .query(sqlQuery, sqlParams)
    .then((res) => res.rows)
    .catch((err) => null);
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;
