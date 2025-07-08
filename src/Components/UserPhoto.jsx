function UserPhoto({ fileId }) {
  if (!fileId) return null;

  const BUCKET_ID = import.meta.env.VITE_USER_BUCKET_ID;
  const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECTID;

  const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${fileId}/download?project=${PROJECT_ID}`;

  return (
    <img
      src={imageUrl}
      alt="User"
      className="w-20 h-20 rounded-full object-cover border"
    />
  );
}

export default UserPhoto;
