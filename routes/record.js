const express = require("express");
const recordRoutes = express.Router();
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

recordRoutes.route("/products").get(function (req, res) {
  let db_connect = dbo.getDb("mongodb");
  db_connect
    .collection("products")
    .find({})
    .sort(req.query.sort)
    .toArray(function (err, result) {
      if (err) throw err;
      res.json(result);
    });
});

recordRoutes.route("/products").post(function (req, res) {
  let db_connect = dbo.getDb("mongodb");
  db_connect
    .collection("products")
    .findOne({ nazwa: req.body.nazwa }, function (err, result) {
      if (result == null) {
        let myobj = {
          nazwa: req.body.nazwa,
          cena: req.body.cena,
          opis: req.body.opis,
          ilosc: req.body.ilosc,
          jednostka_miary: req.body.jednostka_miary,
        };
        db_connect
          .collection("products")
          .insertOne(myobj, function (err, result) {
            if (err) throw err;
            res.json(result);
          });
      } else {
        console.log("Produkt już istnieje");
        res.status(400).json({});
      }
    });
});

recordRoutes.route("/products/:id").put(function (req, res) {
  let db_connect = dbo.getDb("mongodb");
  let myquery = { _id: ObjectId(req.params.id) };
  let newvalues = {
    $set: {
      nazwa: req.body.nazwa,
      cena: req.body.cena,
      opis: req.body.opis,
      ilosc: req.body.ilosc,
      jednostka_miary: req.body.jednostka_miary,
    },
  };
  db_connect
    .collection("products")
    .updateOne(myquery, newvalues, function (err, result) {
      if (err) throw err;
      res.json(result);
    });
});

recordRoutes.route("/products/:id").delete((req, res) => {
  let db_connect = dbo.getDb("mongodb");
  let myquery = { _id: ObjectId(req.params.id) };
  db_connect.collection("products").findOne(myquery, function (err, result) {
    if (result == null) {
      console.log("Produkt nie istnieje");
      res.status(400).json({});
    } else {
      db_connect.collection("products").deleteOne(myquery, function (err, obj) {
        if (err) throw err;
        res.status(200).json({});
      });
    }
  });
});

// http://localhost:5000/products/report?nazwa=marchew,pomidor
recordRoutes.route("/products/report").get(function (req, res) {
  let db_connect = dbo.getDb("mongodb");
  let wybrane = req.query.nazwa ? req.query.nazwa.split(",") : [];
  let match =
    wybrane.length !== 0
      ? { $match: { nazwa: { $in: wybrane } } }
      : { $match: {} };
  db_connect
    .collection("products")
    .aggregate([
      match,
      {
        $group: {
          _id: null,
          Ilosc_wszystkich_produktow: { $sum: "$ilosc" },
          Cena_wszystkich_produktow: {
            $sum: { $multiply: ["$ilosc", "$cena"] },
          },
        },
      },
    ])
    .toArray(function (err, result) {
      if (err) throw err;
      res.json(result);
    });
});

module.exports = recordRoutes;
