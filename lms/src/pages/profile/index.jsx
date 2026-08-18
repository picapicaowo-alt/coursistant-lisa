import styles from "./styles.module.scss";
import { useState } from "react";
import About from "./about";
import MyCourse from "./myCourse";
import Preferences from "./preferences";
import { useAuth } from "../../contexts/AuthContext.js";
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import getCroppedImg from '../../utils/cropImage';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EditProfileModal from './editProfileModal';

const Profile = () => {
    const [activeTab, setActiveTab] = useState("About");
    const { user } = useAuth();
    const VITE_PROFILE_API_DOMAIN = import.meta.env.VITE_PROFILE_API_DOMAIN_NAME;
    const [isCropModalOpen, setCropModalOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "/icons/default_avatar.jpg");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const navigate = useNavigate();

    const name = user?.name;

    const onSelectFile = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setImageSrc(reader.result);
          setCropModalOpen(true);
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
    
        // 1️⃣ Upload the cropped image to the backend
        const formData = new FormData();
        formData.append("userId", user.id);
        formData.append("profile", JSON.stringify({ userId: user.id }));
        formData.append("avatar", croppedImg, "avatar.jpg");
    
        console.log("Uploading avatar for user:", user.id);
        const uploadRes = await axios.post(
          `${VITE_PROFILE_API_DOMAIN}/profile/update`,
          formData,
          { headers: { "Content-Type": "multipart/form-data", 'token': user.accessToken } }
        );
    
        console.log("Avatar upload response:", uploadRes);
    
        // ✅ Only update UI if upload succeeded
        if (uploadRes.status === 200 || uploadRes.data.success) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setAvatarUrl(reader.result); // Update avatar immediately
          };
          reader.readAsDataURL(croppedImg);
        } else {
          alert('Failed to update avatar');
        }
    
        setCropModalOpen(false);
      } catch (e) {
        alert('Failed to update avatar');
        setCropModalOpen(false);
        console.error("Avatar upload error:", e);
      }
    };
    

    return (
    <div className="max-w-[1400px] mx-auto flex flex-col items-center p-8">
      {/* Cover Image */}
      <div className="w-full h-48 rounded-xl overflow-hidden mb-[-48px]">
        <img
          src="/icons/profile/header.png"
          alt="Cover"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Profile Section */}
      <div className="flex w-full items-center gap-10 mt-10">
        {/* Profile Picture */}
        <div className="relative ml-10 mt-[-40px]">
          <img
            src={avatarUrl}
            alt="Profile"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/icons/default_avatar.jpg";
            }}
            className="max-w-40 max-h-40 rounded-full border-4 border-[rgba(203,213,224,1)] bg-gray-100 cursor-pointer"
            onClick={() => document.getElementById('avatarUploadHome').click()}
          />
          <input type="file" accept="image/*" onChange={onSelectFile} style={{ display: 'none' }} id="avatarUploadHome" />
        </div>
        {/* Name and Info */}
        <div className="flex flex-col gap-1">
            <h2 className="mt-3 text-2xl font-medium tracking-wide">{name}</h2>
            <p className="text-lg text-[rgba(113,128,150,1)]">Manhattan College · Class of 2023</p>
        </div>
        <div className="flex-1"/>
      
        <button className="cursor-pointer mr-10 px-4 py-2 border border-[rgba(203,213,224,1)] rounded-lg text-gray-700 hover:bg-gray-100 transition" onClick={() => setEditModalOpen(true)}>
            Edit Profile
        </button>
      </div>

       {/* Cropping Modal */}
      {isCropModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg flex flex-col items-center">
            <div className="relative w-72 h-72 bg-gray-200">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="w-60 mt-4">
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e, z) => setZoom(z)}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 border rounded" onClick={() => setCropModalOpen(false)}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={showCroppedImage}>Save</button>
            </div>
          </div>
        </div>
      )}
      {/* Tabs */}
      <div className="w-[90%]">
        <div className="flex mt-10 space-x-6 justify-start gap-5">
          {["About", "My course", "Preferences"].map((item) => (
              <button
              key={item}
              className={`pb-2 cursor-pointer text-xl tracking-wide ${
                  activeTab === item
                  ? "border-b-5 border-[rgba(86,111,232,1)]"
                  : "border-b-5 border-transparent"
              }`}
              onClick={() => setActiveTab(item)}
              >
              {item}
              </button>
          ))}
        </div>
        <div className={styles.horizontalDivider}/>
      </div>
        {/* About Tab */}
        {activeTab === "About" && <About />}
        {activeTab === "My course" && <MyCourse />}
        {activeTab === "Preferences" && <Preferences />}
        <EditProfileModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} />
    </div>
    )
}

export default Profile;
