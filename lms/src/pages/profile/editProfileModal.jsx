import React, { useState, useEffect } from "react";
import styles from "./styles.module.scss";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext.js";
import getCroppedImg from '../../utils/cropImage';

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedImage, setCroppedImage] = useState(null);
  

  useEffect(() => {
    console.log("Modal open:", isOpen, "User:", user);
    const fetchProfile = async () => {
      if (isOpen && user?.id) {
        console.log("Fetching profile for userId:", user.id);
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_DOMAIN_NAME}/profile/user/${user.id}`
          );
          setProfileData(res.data);
        } catch (err) {
          console.error("Profile fetch error:", err);
          setProfileData(null);
        }
      } else if (!isOpen) {
        setProfileData(null);
      }
    };
    fetchProfile();
  }, [isOpen, user]);

  const handleChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setShowCrop(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const showCroppedImage = async () => {
    try {
      const croppedImg = await getCroppedImg(imageSrc, croppedAreaPixels);
      setCroppedImage(croppedImg);
      setShowCrop(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = user?.id;
    if (!userId || !profileData) {
      alert("User ID not found");
      return;
    }
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append(
      "profile",
      JSON.stringify({
        userId,
        id: profileData.id || userId,
        level: profileData.level,
        schoolName: profileData.schoolName ?? "",
        orderN: profileData.orderN,
      })
    );
    if (croppedImage) {
      formData.append("avatar", croppedImage, "avatar.jpg");
    } else {
      formData.append("avatar", null);
    }
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_DOMAIN_NAME}/profile/update`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      
      onClose();
    } catch (err) {
      alert("Error updating profile");
      console.error("Profile update error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-semibold mb-6">Profile</h2>
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <label className="text-[12px] font-lite">Full Name</label>
          <input className="border rounded-xl text-[12px] ont-lite px-3 py-2 h-[40px] border-[#E2E8F0]" type="text" value={user?.name || user?.fullName || ""} readOnly />
          <label className="text-[12px]">Email</label>
          <input  className="border rounded-xl text-[12px]  px-3 py-2 h-[40px] border-[#E2E8F0]" type="email" value={user?.email || ""} readOnly />
          <div className="border-t-2 border-dashed border-gray-300 w-full my-5" />
          <label className="text-[12px]">Role</label>
          <input  className="border rounded-xl text-[12px]  px-3 py-2 h-[40px] border-[#E2E8F0]" type="text" value={user?.role || "Student"} readOnly />
          <label className="text-[12px]">Level</label>
          <input  className="border rounded-xl text-[12px]  px-3 py-2 h-[40px] border-[#E2E8F0]" type="text" value={profileData?.level ?? "Junior"} readOnly />
          <label className="text-[12px]">School</label>
          <input  className="border rounded-xl text-[12px]  px-3 py-2 h-[40px] border-[#E2E8F0]" type="text" value={profileData?.schoolName ?? "Manhattan College"} onChange={e => handleChange('schoolName', e.target.value)} />
          <label className="text-[12px]">Order N</label>
          <input  className="border rounded-xl text-[12px]  px-3 py-2 h-[40px] border-[#E2E8F0]" type="text" value={profileData?.orderN ?? "8547921"} readOnly />
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-1 border border-[#CBD5E0] rounded-lg text-[12px] cursor-pointer" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-1 bg-[#566FE8] text-white rounded-lg text-[12px] cursor-pointer">Save changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal; 