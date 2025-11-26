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

// --------------------------------------------------------------
// 🎬 SPIDER-MAN CAST (Tobey + Andrew + Tom Holland universe)
// --------------------------------------------------------------
const spiderUsers = [
  // Tobey Trilogy
  ["Tobey", "Maguire", "male"],
  ["Kirsten", "Dunst", "female"],
  ["James", "Franco", "male"],
  ["Willem", "Dafoe", "male"],
  ["Alfred", "Molina", "male"],
  ["Thomas", "Haden Church", "male"],
  ["Topher", "Grace", "male"],
  ["Rosemary", "Harris", "female"],
  ["J.K.", "Simmons", "male"],
  ["Cliff", "Robertson", "male"],

  // Amazing Spider-Man
  ["Andrew", "Garfield", "male"],
  ["Emma", "Stone", "female"],
  ["Sally", "Field", "female"],
  ["Denis", "Leary", "male"],
  ["Rhys", "Ifans", "male"],
  ["Jamie", "Foxx", "male"],
  ["Dane", "DeHaan", "male"],
  ["Paul", "Giamatti", "male"],
  ["Martin", "Sheen", "male"],

  // Tom Holland MCU
  ["Tom", "Holland", "male"],
  ["Zendaya", "", "female"],
  ["Jacob", "Batalon", "male"],
  ["Marisa", "Tomei", "female"],
  ["Michael", "Keaton", "male"],
  ["Jon", "Favreau", "male"],
  ["Jake", "Gyllenhaal", "male"],
  ["Benedict", "Cumberbatch", "male"],
  ["Tony", "Revolori", "male"],
  ["Angourie", "Rice", "female"],
  ["J.B.", "Smoove", "male"],

  // No Way Home villains
  ["Willem", "Dafoe", "male"], // already above but allowed
  ["Alfred", "Molina", "male"],
  ["Jamie", "Foxx", "male"],
  ["Rhys", "Ifans", "male"],
  ["Thomas", "Haden Church", "male"],
];

// --------------------------------------------------------------
// TMDB IMAGE FETCH
// --------------------------------------------------------------
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
    console.log("❌ TMDB Error:", fullName, err.message);
    return null;
  }
};

// --------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------
const randomBio = () => [
  "Friendly neighborhood hero.",
  "With great power comes great responsibility.",
  "Saving New York one swing at a time.",
  "Calm mind, fast reflexes, strong heart.",
  "Spider-sense tingling!",
][Math.floor(Math.random() * 5)];

const randomSkills = () =>
  ["Agility", "Combat", "Leadership", "Web-Tech", "Fitness"].slice(
    0,
    Math.floor(Math.random() * 3) + 2
  );

const randomAge = () => Math.floor(Math.random() * 15) + 20;

// --------------------------------------------------------------
// SEED FUNCTION
// --------------------------------------------------------------
const seedUsers = async () => {
  try {
    console.log("Connecting...");
    await mongoose.connect(MONGO_URL);
    console.log("Connected!");

    for (const [firstName, lastName, gender] of spiderUsers) {
      // CLEAN EMAIL NAME
      const cleanFirst = firstName.replace(/[^A-Za-z0-9]/g, "");
      const cleanLast = lastName.replace(/[^A-Za-z0-9]/g, "");

      const emailId =
        `${cleanFirst}${cleanLast}`.toLowerCase() + "@devverse.com";

      const exists = await User.findOne({ emailId });
      if (exists) {
        console.log("⚠️ Exists, skipping:", emailId);
        continue;
      }

      const fullName = `${firstName} ${lastName}`;
      console.log("🔎 Fetching:", fullName);

      const photoUrl = await getPhoto(fullName);
      const hashedPassword = await bcrypt.hash("Spider@1234", 10);

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

    console.log("\n🔥 Spider-Man cast added successfully!");
  } catch (err) {
    console.log("❌ Error:", err.message);
  } finally {
    mongoose.connection.close();
    console.log("DB closed.");
  }
};

seedUsers();
