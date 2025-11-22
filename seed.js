import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import axios from "axios";
import User from "./src/models/user.js";

dotenv.config();

const MONGO_URL = process.env.MONGO_URI;
const TMDB_KEY = process.env.TMDB_KEY;

if (!MONGO_URL || !TMDB_KEY) {
  console.log("❌ Missing MONGO_URI or TMDB_KEY in .env");
  process.exit(1);
}

// ---- MARVEL LIST ----
const marvelUsers = [
  ["Brie", "Larson", "female"],
  ["Scarlett", "Johansson", "female"],
  ["Elizabeth", "Olsen", "female"],
  ["Zoe", "Saldana", "female"],
  ["Karen", "Gillan", "female"],
  ["Tessa", "Thompson", "female"],
  ["Natalie", "Portman", "female"],
  ["Cobie", "Smulders", "female"],
  ["Hayley", "Atwell", "female"],
  ["Gwyneth", "Paltrow", "female"],
  ["Lupita", "Nyong'o", "female"],
  ["Danai", "Gurira", "female"],
  ["Letitia", "Wright", "female"],
  ["Pom", "Klementieff", "female"],
  ["Gemma", "Chan", "female"],
  ["Rachel", "McAdams", "female"],
  ["Evangeline", "Lilly", "female"],
  ["Kat", "Dennings", "female"],
  ["Salma", "Hayek", "female"],
  ["Angelina", "Jolie", "female"],
  ["Florence", "Pugh", "female"],
  ["Hailee", "Steinfeld", "female"],
  ["Sophia", "Di Martino", "female"],
  ["Iman", "Vellani", "female"],
  ["Bridget", "Regan", "female"],

  // MALES
  ["Robert", "Downey Jr.", "male"],
  ["Chris", "Evans", "male"],
  ["Chris", "Hemsworth", "male"],
  ["Mark", "Ruffalo", "male"],
  ["Jeremy", "Renner", "male"],
  ["Tom", "Holland", "male"],
  ["Benedict", "Cumberbatch", "male"],
  ["Chadwick", "Boseman", "male"],
  ["Sebastian", "Stan", "male"],
  ["Anthony", "Mackie", "male"],
  ["Tom", "Hiddleston", "male"],
  ["Paul", "Rudd", "male"],
  ["Don", "Cheadle", "male"],
  ["Samuel L.", "Jackson", "male"],
  ["Dave", "Bautista", "male"],
  ["Chris", "Pratt", "male"],
  ["Josh", "Brolin", "male"],
  ["Ben", "Kingsley", "male"],
  ["Oscar", "Isaac", "male"],
  ["Mahershala", "Ali", "male"],
  ["Richard", "Madden", "male"],
  ["Kumail", "Nanjiani", "male"],
  ["Simu", "Liu", "male"],
  ["Aaron", "Taylor-Johnson", "male"],
  ["Michael B.", "Jordan", "male"],
];

// ---- TMDB FETCH ----
const getPhoto = async (fullName) => {
  try {
    const url = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(
      fullName
    )}`;

    const res = await axios.get(url);

    if (!res.data.results.length) {
      console.log("❌ No TMDB match for:", fullName);
      return null;
    }

    const profile = res.data.results[0].profile_path;
    return profile ? `https://image.tmdb.org/t/p/w500${profile}` : null;
  } catch (err) {
    console.log("❌ TMDB error:", fullName, err.message);
    return null;
  }
};

// ---- HELPERS ----
const randomBio = () => [
  "Marvel fan and superhero at heart.",
  "Saving the world one line of code at a time.",
  "Adventure seeker and fitness lover.",
  "Calm mind, strong spirit, heroic soul.",
  "Tech geek with MCU energy.",
][Math.floor(Math.random() * 5)];

const randomSkills = () =>
  ["Combat", "Leadership", "React", "Node.js", "Fitness"].slice(
    0,
    Math.floor(Math.random() * 3) + 2
  );

const randomAge = () => Math.floor(Math.random() * 15) + 25;

// ---- SEED ----
const seedUsers = async () => {
  try {
    console.log("Connecting...");
    await mongoose.connect(MONGO_URL);
    console.log("Connected!");

    for (const [firstName, lastName, gender] of marvelUsers) {
      // --- FIX EMAIL ---
      const cleanLast = lastName.replace(/[^A-Za-z]/g, "");
      const emailId = `${(firstName + cleanLast).toLowerCase()}@devverse.com`;

      const exists = await User.findOne({ emailId });
      if (exists) {
        console.log("⚠️ Exists, skipping:", emailId);
        continue;
      }

      const fullName = `${firstName} ${lastName}`;
      console.log("🔎 Fetching:", fullName);

      const photoUrl = await getPhoto(fullName);
      const hashedPassword = await bcrypt.hash("Marvel@1234", 10);

      await new User({
        firstName,
        lastName,
        emailId,
        password: hashedPassword,
        gender,
        age: randomAge(),
        about: randomBio(),
        skills: randomSkills(),
        photoUrl,
      }).save();

      console.log("✅ Added:", fullName);
    }

    console.log("\n🔥 All users added!");
  } catch (err) {
    console.log("❌ Error:", err.message);
  } finally {
    mongoose.connection.close();
    console.log("DB closed.");
  }
};

seedUsers();
