import { v2 as cloudinary } from "cloudinary";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME as string;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY as string;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET as string;

cloudinary.config({
  cloud_name: "ddhdd57mc",
  api_key: "635942991421693",
  api_secret: "lQtOT_pJvcNzsww8Q7TwJNYTgEY",
});

export default cloudinary;
