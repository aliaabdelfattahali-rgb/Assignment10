import express from "express";
import { userRouter } from "./modules/User/user.controller.js";

export function bootstrap(app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/uploads", express.static("uploads"));

  app.get("/", (req, res) => {
    res.json({ message: "Saraha App API (Assignment 10) is running" });
  });

  app.use("/api/users", userRouter);

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  });
}
