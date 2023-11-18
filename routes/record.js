const express = require("express");
const recordRoutes = express.Router();
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

recordRoutes.route("/products").get(async function (req, res) {
  try {
    let db_connect = await dbo.getDb("mongodb");
    let sort = req.query.sort ? { [req.query.sort]: 1 } : {};
    let filter = req.query.nazwa ? { nazwa: req.query.nazwa } : {};
    let result = await db_connect
      .collection("products")
      .find(filter)
      .sort(sort)
      .toArray();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error" });
  }
});

recordRoutes.route("/products").post(async function (req, res) {
  try {
    let db_connect = await dbo.getDb("mongodb");
    let result = await db_connect
      .collection("products")
      .findOne({ nazwa: req.body.nazwa });

    if (result == null) {
      let myobj = {
        nazwa: req.body.nazwa,
        cena: req.body.cena,
        opis: req.body.opis,
        ilosc: req.body.ilosc,
        jednostka_miary: req.body.jednostka_miary,
      };

      let insertResult = await db_connect
        .collection("products")
        .insertOne(myobj);
      res.json(insertResult);
    } else {
      console.log("Produkt już istnieje");
      res.status(400).json({ error: "Produkt już istnieje" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error" });
  }
});

recordRoutes.route("/products/:id").put(async function (req, res) {
  try {
    let db_connect = await dbo.getDb("mongodb");
    let myquery = { _id: new ObjectId(req.params.id) };
    let newvalues = {
      $set: {
        nazwa: req.body.nazwa,
        cena: req.body.cena,
        opis: req.body.opis,
        ilosc: req.body.ilosc,
        jednostka_miary: req.body.jednostka_miary,
      },
    };
    let result = await db_connect
      .collection("products")
      .findOne({ nazwa: req.body.nazwa });
    if (result == null || result._id.toString() === req.params.id) {
      await db_connect.collection("products").updateOne(myquery, newvalues);
      res.status(200).json({ ...newvalues }.$set);
    } else {
      console.log("Produkt już istnieje");
      res.status(400).json({});
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred" });
  }
});

recordRoutes.route("/products/:id").delete(async (req, res) => {
  try {
    let db_connect = await dbo.getDb("mongodb");
    let myquery = { _id: new ObjectId(req.params.id) };
    let deleteResult = await db_connect
      .collection("products")
      .deleteOne(myquery);
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: "Nie ma takiego produktu" });
    }
    res.status(200).json({});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error" });
  }
});

// http://localhost:5000/products/report?nazwa=marchew,pomidor
recordRoutes.route("/products/report").get(async function (req, res) {
  let db_connect = await dbo.getDb("mongodb");
  let wybrane = req.query.nazwa ? req.query.nazwa.split(",") : [];
  let match =
    wybrane.length !== 0
      ? { $match: { nazwa: { $in: wybrane } } }
      : { $match: {} };
  let result = db_connect
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
    .toArray();
  res.json(await result);
});

module.exports = recordRoutes;
