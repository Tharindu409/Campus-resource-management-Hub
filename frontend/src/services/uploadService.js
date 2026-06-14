export async function uploadResourceImage(file) {
  if (!file) {
    throw new Error('Please select an image file')
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WEBP images are allowed')
  }

  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB')
  }

  const formData = new FormData()
  formData.append('file', file)

  const token = localStorage.getItem('token')

  const response = await fetch('http://localhost:8091/api/uploads/resources', {
    method: 'POST',
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
    body: formData,
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to upload image')
  }

  if (!data?.url) {
    throw new Error('Upload succeeded but no image URL was returned')
  }

  return data.url
}