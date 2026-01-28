import React, { useState } from "react";
import { useEffect, useRef } from "react";

import useLoginStore from "../../store/useLoginStore";
import countries from "../../utils/countriles";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../store/useUserStore";
import { useForm } from "react-hook-form";
import useThemeStore from "../../store/themeStore";
import { motion } from "framer-motion";
import { FaArrowLeft, FaChevronDown, FaPlus, FaUser, FaWhatsapp } from "react-icons/fa";
import Spinner from "../../utils/Spinner";

import { toast } from "react-toastify";


import { sendOtp, verifyOtp, updateUserProfile } from "../../services/user.service";



// ------------------------------------
// Validation Schema
// ------------------------------------
const loginValidationSchema = yup
  .object()
  .shape({
    phoneNumber: yup
      .string()
      .nullable()
      .notRequired()
      .matches(/^\d+$/, "Phone number must be digits")
      .transform((value, originalValue) =>
        originalValue.trim() === "" ? null : value
      ),
    email: yup
      .string()
      .nullable()
      .notRequired()
      .email("Enter a valid email")
      .transform((value, originalValue) =>
        originalValue.trim() === "" ? null : value
      ),
  })
  .test(
    "at-least-one",
    "Either email or phone number is required",
    function (value) {
      return !!(value.phoneNumber || value.email);
    }
  );

const otpValidationSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .required("OTP is required"),
});

const profileValidationSchema = yup.object().shape({
  username: yup.string().required("Username is required"),
  agreed: yup.bool().oneOf([true], "You must agree to the terms"),
});

const avatars = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
];



// ------------------------------------
// Component
// ------------------------------------
const Login = () => {
  const { step, setStep, setUserPhoneData, userPhoneData, resetLoginState } = useLoginStore();

 useEffect(() => {
  resetLoginState();
}, [resetLoginState]);


  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();
  const [loading,setLoading]=useState(false);

  const { handleSubmit: handleOtpSubmit, formState: { errors: otpErrors }, setValue: setOtpValue } = useForm({
    resolver: yupResolver(otpValidationSchema),
  });

  const { register: profileRegister, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, watch } = useForm({
    resolver: yupResolver(profileValidationSchema),
  });

  const {
  register: loginRegister,
  handleSubmit: handleLoginSubmit,
  formState: { errors: loginErrors }
} = useForm({
  resolver: yupResolver(loginValidationSchema),
});

const dropdownRef = useRef(null);






  const filterCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm)
  );



const onLoginSubmit = async () => {
  try {
    setLoading(true);

    if (email) {
      const response = await sendOtp(null,null,email);

      if (response.status === "success") {
        toast.info("OTP is sent to your email");
        setUserPhoneData({ email });
        setStep(2);
      }
    } else {
      const response = await sendOtp(phoneNumber, selectedCountry.dialCode);

      if (response.status === "success") {
        toast.info("OTP is sent to phone number");
        setUserPhoneData({
          phoneNumber,
          phoneSuffix: selectedCountry.dialCode,
        });
        setStep(2);
      }
    }
  } catch (error) {
    console.log(error);
    setError(error.message || "Failed to send OTP");
  } finally {
    setLoading(false);
  }
}





const onOtpSubmit = async () => {
  try {
    setLoading(true);

    if (!userPhoneData) {
      throw new Error("Phone or email data is missing");
    }

    const otpString = otp.join("");
    let response;

    // Email verification
if (userPhoneData?.email) {
  response = await verifyOtp(
    null,                  // phoneNumber
    null,                  // phoneSuffix
    userPhoneData.email,   // email
    otpString              // otp
  );
} 
// Phone verification
else {
  response = await verifyOtp(
    userPhoneData.phoneNumber, // phoneNumber
    userPhoneData.phoneSuffix, // phoneSuffix
      null,                     // email
    otpString                  // otp
  );
}


    if (response.status === "success") {
      toast.success("OTP verify successfully");
      
      const token=response.data?.token;
      localStorage.setItem("auth_token",token)
      const user = response.data?.user || response?.user;
      // const user=response.data?.user;
      

      if (user?.username && user?.profilePicture) {
        setUser(user);
        toast.success("Welcome back to NEXCHAT APP");
        navigate("/");
        resetLoginState();
      }
      else{
        setStep(3)
      }
    }
  } catch (error) {
    console.log(error);
    setError(error.message || "OTP verification failed");
  } finally {
    setLoading(false);
  }
}



// const handleFileChange = (e) => {
//   const file = e.target.files[0];
//   if (file) {
//     setProfilePictureFile(file);
//     setProfilePicture(URL.createObjectURL(file));
//   }
// };

// const onProfileSubmit = async (data) => {
//   try {
//     setLoading(true);

//     const formData = new FormData();
//     formData.append("username", data.username);
//     formData.append("agreed", data.agreed);

//     if (profilePictureFile) {
//       formData.append("media", profilePictureFile);
//     }else{
//         formData.append("profilePicture",selectedAvatar)
//     }

//     await updateUserProfile(formData);
//     toast.success("Welcome back to NashApp");
//     navigate('/')
//     resetLoginState();
//   } catch (error) {
//     console.log(error);
//     toast.error(error.message || "Failed to update profile");
//   } finally {
//     setLoading(false);
//   }
// }



const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // setSelectedAvatar(null); // Avatar reset
    setProfilePictureFile(file);
    setProfilePicture(URL.createObjectURL(file));
  }
};

// -------------------------------
// AVATAR SELECT HANDLER
// -------------------------------
const handleAvatarSelect = (avatarUrl) => {
  setProfilePictureFile(null); // File reset
  setProfilePicture(avatarUrl);
  setSelectedAvatar(avatarUrl);
};

// -------------------------------
// SUBMIT HANDLER
// -------------------------------
const onProfileSubmit = async (data) => {
  try {
    setLoading(true);

    const formData = new FormData();
    formData.append("username", data.username);
    formData.append("agreed", data.agreed);

    // CASE 1: If user uploads file -> send media
    if (profilePictureFile) {
      formData.append("media", profilePictureFile);
    }else{
      formData.append("profilePicture",selectedAvatar)
    }



    await updateUserProfile(formData);

    toast.success("Welcome back to NEXCHAT APP");
    navigate("/");
    resetLoginState();

  } catch (error) {
    console.log(error);
    toast.error(error.message || "Failed to update profile");
  } finally {
    setLoading(false);
  }
};






const handleOtpChange = (index, value) => {
  // Copy current OTP array
  const newOtp = [...otp];

  // Set the value at the current index
  newOtp[index] = value;
  setOtp(newOtp);

  // Update react-hook-form value
  setOtpValue("otp", newOtp.join(""));

  // Focus next input if value entered and not the last input
  if (value && index < 5) {
     document.getElementById(`otp-${index + 1}`).focus();
  }
};









 const ProgressBar = () => (
  <div
    className={`w-full h-1.5 rounded-full mb-6 overflow-hidden
    ${theme === "dark"
      ? "bg-[#2a3942]"
      : "bg-[#e0e0e0]"}`}
  >
    <div
      className={`h-full rounded-full transition-all duration-500 ease-out
      ${theme === "dark"
        ? "bg-[#25D366]"
        : "bg-[#25D366]"}`}
      style={{ width: `${(step / 3) * 100}%` }}
    />
  </div>
);



const handleBack = () =>{
    setStep(1);
    setUserPhoneData(null);
    setOtp(["", "", "", "", "", ""])
    setError("")

}


useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target)
    ) {
      setShowDropdown(false);
    }
  };

  if (showDropdown) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showDropdown]);





 return (
  <div
    className={`min-h-screen flex items-center justify-center p-4
    ${theme === "dark"
      ? "bg-[#0b141a]"
      : "bg-[#eae6df]"}`}
  >



 <motion.div
  className={`p-6 md:p-8 w-full max-w-md relative z-10
  flex flex-col items-center gap-5
  rounded-2xl
  transition-all duration-300 ease-out
  ${theme === "dark"
    ? `
      bg-[#202c33]
      text-gray-200
      shadow-[0_20px_60px_rgba(0,0,0,0.6)]
      border border-[#2a3942]
    `
    : `
      bg-white
      text-gray-800
      shadow-[0_10px_40px_rgba(0,0,0,0.15)]
      border border-gray-200
    `}
`}
>








       <motion.div
  initial={{ opacity: 0, scale: 0 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ type: "spring", stiffness: 260, damping: 20 }}
  className={`w-20 h-20 rounded-full mx-auto mb-4
  flex items-center justify-center
  ${theme === "dark"
    ? "bg-[#25D366] shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
    : "bg-[#25D366] shadow-[0_8px_25px_rgba(0,0,0,0.25)]"}
`}
>
  <FaWhatsapp className="w-10 h-10 text-white" />
</motion.div>


        <h1
  className={`text-2xl font-semibold text-center mt-2 mb-1
  ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}
>
  NEXCHAT APP
</h1>


        <ProgressBar />

        {error && (
  <p
    className={`text-sm text-center mb-4 px-3 py-2 rounded-lg
    ${theme === "dark"
      ? "bg-[#2a3942] text-red-400"
      : "bg-[#fff3f3] text-red-600"}`}
  >
    {error}
  </p>
)}


        {step === 1 && (
          <form className="space-y-4" onSubmit={handleLoginSubmit(onLoginSubmit)}>
            <p
  className={`text-center mb-4 text-sm
  ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
>
  Enter your phone number or email to receive an OTP
</p>


            <div className="relative">
              <div className="flex">
                <div className="w-1/3">
                 <button
  type="button"
  className={`flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm
  rounded-lg transition
  ${theme === "dark"
    ? "bg-[#2a3942] text-gray-200 hover:bg-[#32424b]"
    : "bg-[#f0f2f5] text-gray-800 hover:bg-[#e4e6e9]"}
  focus:outline-none`}
  onClick={() => setShowDropdown(!showDropdown)}
>
  <span
    className="text-lg"
    style={{ fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji" }}
  >
    {selectedCountry?.flag || "🏳️"}
  </span>
  <span className="ml-1">
    {selectedCountry?.dialCode}
  </span>
  <FaChevronDown className="ml-2 text-gray-500" />
</button>



                  {showDropdown && (
  <div
  ref={dropdownRef}
    className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-lg border shadow-lg
    ${theme === "dark"
      ? "bg-[#202c33] border-[#2a3942]"
      : "bg-white border-gray-200"}`}
  >
    <div
      className={`sticky top-0 p-2
      ${theme === "dark" ? "bg-[#202c33]" : "bg-white"}`}
    >
      <input
        type="text"
        placeholder="Search country"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={`w-full px-3 py-2 text-sm rounded-md
        ${theme === "dark"
          ? "bg-[#2a3942] text-gray-200 placeholder-gray-400"
          : "bg-[#f0f2f5] text-gray-800 placeholder-gray-500"}
        focus:outline-none focus:ring-2 focus:ring-[#25D366]`}
      />
    </div>

    {filterCountries.map((country) => (
      <button
        key={country.alpha2}
        type="button"
        className={`w-full text-left px-3 py-2 text-sm transition
        ${theme === "dark"
          ? "text-gray-200 hover:bg-[#2a3942]"
          : "text-gray-800 hover:bg-[#f0f2f5]"}
        focus:outline-none`}
        onClick={() => {
          setSelectedCountry(country);
          setShowDropdown(false);
        }}
      >
        {country.flag} ({country.dialCode}) {country.name}
      </button>
    ))}
  </div>
)}

                </div>

          <input
  type="text"
  {...loginRegister("phoneNumber")}
  value={phoneNumber}
  onChange={(e) => setPhoneNumber(e.target.value)}
  placeholder="Phone number"
  className={`w-2/3 px-4 py-2 text-sm rounded-lg
  ${theme === "dark"
    ? "bg-[#2a3942] text-white placeholder-gray-400"
    : "bg-[#f0f2f5] text-gray-800 placeholder-gray-500"}
  focus:outline-none focus:ring-2 focus:ring-[#25D366]
  ${loginErrors.phoneNumber ? "ring-2 ring-red-500" : ""}`}
/>


              </div>
            {loginErrors.phoneNumber && (
  <p
    className={`mt-1 text-xs
    ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
  >
    {loginErrors.phoneNumber.message}
  </p>
)}


            </div>

        <div className="flex items-center my-4 w-full">
  <div
    className={`flex-grow border-t
    ${theme === "dark" ? "border-[#2a3942]" : "border-gray-300"}`}
  />
  <span
    className={`mx-3 text-xs uppercase
    ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
  >
    or
  </span>
  <div
    className={`flex-grow border-t
    ${theme === "dark" ? "border-[#2a3942]" : "border-gray-300"}`}
  />
</div>


<div
  className={`flex items-center px-3 py-2 rounded-lg
  ${theme === "dark"
    ? "bg-[#2a3942]"
    : "bg-[#f0f2f5]"}
  focus-within:ring-2 focus-within:ring-[#25D366]`}
>
  <FaUser className="mr-2 text-gray-400" />

  <input
    type="email"
    {...loginRegister("email")}
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Email (optional)"
    className={`w-full bg-transparent text-sm
    ${theme === "dark"
      ? "text-gray-200 placeholder-gray-400"
      : "text-gray-800 placeholder-gray-500"}
    focus:outline-none`}
  />

  {loginErrors.email && (
    <p
      className={`ml-2 text-xs
      ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
    >
      {loginErrors.email.message}
    </p>
  )}
</div>


<button
  type="submit"
  className={`w-full py-3 rounded-lg font-semibold transition
  bg-[#25D366] text-white
  hover:bg-[#1ebe5d]
  focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2
  ${theme === "dark" ? "focus:ring-offset-[#202c33]" : "focus:ring-offset-white"}`}
>
  {loading ? <Spinner /> : "Send OTP"}
</button>





          </form>
        )}

{step === 2 && (
  <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">

    <p
      className={`text-center text-sm mb-4
      ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
    >
      Enter the 6-digit OTP sent to{" "}
      {userPhoneData?.email
        ? "your email"
        : `${userPhoneData?.phoneSuffix} ${userPhoneData?.phoneNumber}`}
    </p>

    <div className="flex justify-between gap-2">
      {otp.map((digit, index) => (
        <input
          key={index}
          id={`otp-${index}`}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleOtpChange(index, e.target.value)}
          className={`w-11 h-11 text-center text-lg rounded-lg
          ${theme === "dark"
            ? "bg-[#2a3942] text-white"
            : "bg-[#f0f2f5] text-gray-800"}
          focus:outline-none focus:ring-2 focus:ring-[#25D366]
          ${otpErrors.otp ? "ring-2 ring-red-500" : ""}`}
        />
      ))}
    </div>

    {otpErrors.otp && (
      <p
        className={`text-xs text-center
        ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
      >
        {otpErrors.otp.message}
      </p>
    )}

    <button
      type="submit"
      className={`w-full py-3 rounded-lg font-semibold transition
      bg-[#25D366] text-white hover:bg-[#1ebe5d]
      focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2
      ${theme === "dark" ? "focus:ring-offset-[#202c33]" : "focus:ring-offset-white"}`}
    >
      {loading ? <Spinner /> : "Verify OTP"}
    </button>

    <button
      type="button"
      onClick={handleBack}
      className={`w-full py-2 rounded-lg text-sm flex items-center justify-center transition
      ${theme === "dark"
        ? "bg-[#2a3942] text-gray-300 hover:bg-[#32424b]"
        : "bg-[#f0f2f5] text-gray-700 hover:bg-[#e4e6e9]"}`}
    >
      <FaArrowLeft className="mr-2 text-xs" />
      Wrong number? Go back
    </button>

  </form>
)}


{step === 3 && (
  <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">

    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 mb-3">
        <img
          src={profilePicture || selectedAvatar}
          alt="profile"
          className="w-full h-full rounded-full object-cover border border-gray-300"
        />

        <label
          htmlFor="profile-picture"
          className="absolute bottom-0 right-0 bg-[#25D366] text-white p-2 rounded-full cursor-pointer hover:bg-[#1ebe5d] transition"
        >
          <FaPlus className="w-4 h-4" />
        </label>

        <input
          type="file"
          id="profile-picture"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <p
        className={`text-sm mb-3
        ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
      >
        Choose an avatar
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {avatars.map((avatar, index) => (
          <img
            key={avatar}
            src={avatar}
            alt={`Avatar ${index + 1}`}
            onClick={() => handleAvatarSelect(avatar)}
            className={`w-11 h-11 rounded-full cursor-pointer transition
            ${selectedAvatar === avatar
              ? "ring-2 ring-[#25D366]"
              : "ring-1 ring-gray-300 hover:ring-[#25D366]"}`}
          />
        ))}
      </div>
    </div>

    <div className="relative">
      <FaUser
        className={`absolute left-3 top-1/2 -translate-y-1/2
        ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
      />

      <input
        {...profileRegister("username")}
        type="text"
        placeholder="Username"
        className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm
        ${theme === "dark"
          ? "bg-[#2a3942] text-white placeholder-gray-400"
          : "bg-[#f0f2f5] text-gray-800 placeholder-gray-500"}
        focus:outline-none focus:ring-2 focus:ring-[#25D366]`}
      />

      {profileErrors.username && (
        <p className={`mt-1 text-xs ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
          {profileErrors.username.message}
        </p>
      )}
    </div>

    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        {...profileRegister("agreed")}
        id="agreed"
        className="w-4 h-4 text-[#25D366] focus:ring-[#25D366]"
      />
      <label
        htmlFor="agreed"
        className={`text-sm
        ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
      >
        I agree to the{" "}
        <a href="#" className="text-[#25D366] underline">
          Terms and Conditions
        </a>
      </label>
    </div>

    {profileErrors.agreed && (
      <p className={`text-xs ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
        {profileErrors.agreed.message}
      </p>
    )}

    <div className="flex justify-center pt-4">
      <button
        type="submit"
        disabled={!watch("agreed") || loading}
        className={`w-full py-3 rounded-lg font-semibold transition
        bg-[#25D366] text-white hover:bg-[#1ebe5d]
        focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2
        ${theme === "dark" ? "focus:ring-offset-[#202c33]" : "focus:ring-offset-white"}
        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {loading ? <Spinner /> : "Create Profile"}
      </button>
    </div>

  </form>
)}



        
      </motion.div>
    </div>
  );
};

export default Login;
