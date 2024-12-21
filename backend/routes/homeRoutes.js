import express from 'express';
import {getHomePage} from '../controllers/homeController.js';

const router = express.Router();

router.get("/home", getHomePage);

export default router;