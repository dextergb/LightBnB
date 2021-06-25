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
    .catch((err) => console.error(err));
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
    .catch((err) => console.error(err));
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
    .catch((err) => console.error(err));
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const sqlQuery = `SELECT properties.*, reservations.*, AVG(property_reviews.rating) AS average_rating 
  FROM properties
  JOIN reservations ON reservations.property_id = properties.id
  JOIN property_reviews ON property_reviews.property_id = properties.id
  WHERE property_reviews.guest_id = $1 AND end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;
  `;
  const values = [guest_id, limit];
  return pool
    .query(sqlQuery, values)
    .then((res) => res.rows)
    .catch((err) => console.error(err));
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

//  SELECT properties.*, avg(property_reviews.rating) AS average_rating FROM properties JOIN property_reviews ON properties.id = property_id WHERE properties.owner_id = 1 GROUP BY properties.id ORDER BY cost_per_night LIMIT 10;

const getAllProperties = function (options, limit = 10) {
  const sqlParams = [];
  let sqlQuery = `SELECT properties.*, avg(property_reviews.rating) AS average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id WHERE 1 = 1`;

  if (options.city) {
    sqlParams.push(`%${options.city}%`);
    sqlQuery += `AND city LIKE $${sqlParams.length}\n`;
  }

  if (options.owner_id) {
    sqlParams.push(parseInt(options.owner_id));
    sqlQuery += `AND properties.owner_id = $${sqlParams.length}\n`;
  }

  if (options.minimum_price_per_night) {
    sqlParams.push(options.minimum_price_per_night * 100);
    sqlQuery += `AND properties.cost_per_night >= $${sqlParams.length}\n`;
  }

  if (options.maximum_price_per_night) {
    sqlParams.push(options.maximum_price_per_night * 100);
    sqlQuery += `AND properties.cost_per_night <= $${sqlParams.length}\n`;
  }
  if (options.minimum_rating) {
    sqlParams.push(options.minimum_rating);
    sqlQuery += `AND property_reviews.rating >= $${sqlParams.length}\n`;
  }

  sqlParams.push(limit);
  sqlQuery += `GROUP BY properties.id ORDER BY cost_per_night LIMIT $${sqlParams.length};`;

  return pool
    .query(sqlQuery, sqlParams)
    .then((res) => res.rows)
    .catch((err) => console.error(err));
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const sqlQuery = `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;`;
  const values = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms,
  ];
  return pool
    .query(sqlQuery, values)
    .then((res) => res.rows[0])
    .catch((err) => console.error(err));
};
exports.addProperty = addProperty;
