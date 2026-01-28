import React, { useEffect, useState } from "react";

import Layout from "./Layout";
import { motion } from "framer-motion";
import ChatList from "../pages/chatSection/chatList";
import useLayoutStore from "../store/layoutStore";
import { getAllUsers } from "../services/user.service";



const HomePage = () => {
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);

  const [allUsers, setAllUsers] = useState([]);

const getAllUser = async () => {
  try {
    const result = await getAllUsers();

    if (result.status=='success') {
      setAllUsers(result.data);
    }
  } catch (error) {
    console.log(error);
  }
};

useEffect(() => {
  getAllUser();

  const interval = setInterval(() => {
    getAllUser();
  }, 2000); // har 2 second me refresh

  return () => clearInterval(interval);
}, []);





  return (
    <Layout>
      <motion.div
  className="
    h-full
    bg-white dark:bg-[#111b21]
    text-gray-900 dark:text-gray-100
  "
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, ease: "easeOut" }}
>

        <ChatList contacts={allUsers} />
      </motion.div>
    </Layout>
  );
};

export default HomePage;
