import axios from "axios";

export const uploadMedia = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(
    "http://localhost:8000/api/upload",
    formData,
    { withCredentials: true }
  );

  return res.data.url;
};
