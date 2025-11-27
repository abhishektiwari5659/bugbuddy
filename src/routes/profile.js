import express from "express";
export const profileRouter = express.Router();
import { userAuth } from "../middlewares/auth.js";
import { validateProfileData } from "../utils/validation.js";

/* =====================================================
    VIEW PROFILE
===================================================== */
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.userDoc; // mongoose doc
    if (!user) return res.status(404).send("User not found");

    const safeUser = user.toObject();
    delete safeUser.password; // never send password
    
    res.send(safeUser);
  } catch (err) {
    res.status(500).send("Internal server error");
  }
});

/* =====================================================
    EDIT PROFILE
===================================================== */
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateProfileData(req)) {
      throw new Error("invalid edit request");
    }

    // IMPORTANT: Use req.userDoc (REAL mongoose document)
    const loggedInUser = req.userDoc;

    // Update fields from body
    Object.keys(req.body).forEach((key) => {
      if (key === "skills") {
        // convert "react, node" → ["react", "node"]
        loggedInUser.skills = Array.isArray(req.body.skills)
          ? req.body.skills
          : req.body.skills.split(",").map((s) => s.trim());
      } else {
        loggedInUser[key] = req.body[key];
      }
    });

    const updatedUser = await loggedInUser.save();

    const safeUser = updatedUser.toObject();
    delete safeUser.password;

    res.send(safeUser);
  } catch (err) {
    console.log(err);
    res.status(400).send("error: " + err.message);
  }
});
