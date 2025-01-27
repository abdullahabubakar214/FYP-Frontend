import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

const SetOnLockScreen = ({ visible, onClose, qrCodeImage }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const viewShotRef = useRef();

  const images = [
    require('../assets/Background Images/image1.jpg'),
    require('../assets/Background Images/image2.jpg'),
    require('../assets/Background Images/image3.jpg'),
    require('../assets/Background Images/image4.jpg'),
    require('../assets/Background Images/image5.jpg'),
    require('../assets/Background Images/image6.jpg'),
    require('../assets/Background Images/image7.jpg'),
    require('../assets/Background Images/image8.jpg'),
    require('../assets/Background Images/image9.jpg'),
    require('../assets/Background Images/image10.jpg'),
    require('../assets/Background Images/image11.jpg'),
    require('../assets/Background Images/image12.jpg'),
  ];

  const handleImagePress = (image) => {
    setSelectedImage(image);
    setPreviewVisible(true);
  };

  const downloadCompositeImage = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.granted) {
        await MediaLibrary.saveToLibraryAsync(uri);
        alert('Image saved to gallery! You can now set it as your lock screen wallpaper from the gallery.');
      } else {
        alert('Permission to save images to gallery was denied.');
      }
    } catch (error) {
      console.error("Error saving image: ", error);
      alert('Error saving image. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.lockScreenModalContent}>
        {/* Instructions at the top */}
        <Text style={styles.instructionTitle}>How to Set Emergency QR Code on Lock Screen</Text>
        <Text style={styles.stepTitle}>Steps:</Text>
        <Text style={styles.instructionText}>
          This QR code contains basic information about you that can be useful in an emergency.
        </Text>
        <Text style={styles.instructionText}>1. Select an image from below.</Text>
        <Text style={styles.instructionText}>2. Tap "Download Image" to save it to your gallery.</Text>
        <Text style={styles.instructionText}>3. Open your gallery, select the downloaded image, and set it as your lock screen wallpaper.</Text>

        {/* Image Selection Grid */}
        <ScrollView contentContainerStyle={styles.imageGrid}>
          {images.map((image, index) => (
            <TouchableOpacity key={index} onPress={() => handleImagePress(image)}>
              <View style={styles.imageContainer}>
                <Image style={styles.gridImage} source={image} />
                <Image style={styles.qrCodeOverlay} source={{ uri: qrCodeImage }} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Preview Modal */}
      {previewVisible && (
        <Modal visible={previewVisible} animationType="slide" transparent={false}>
          <View style={styles.previewContainer}>
            <ViewShot ref={viewShotRef} style={styles.previewImageContainer}>
              <Image style={styles.previewImage} source={selectedImage} />
              <Image style={styles.qrCodePreviewOverlay} source={{ uri: qrCodeImage }} />
            </ViewShot>
            <TouchableOpacity style={styles.downloadButton} onPress={downloadCompositeImage}>
              <Text style={styles.downloadButtonText}>Download Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.previewCloseButton} onPress={() => setPreviewVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  lockScreenModalContent: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'left',
    marginBottom: 10,
    lineHeight: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
    textAlign: 'left',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  imageContainer: {
    position: 'relative',
    margin: 5,
  },
  gridImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  qrCodeOverlay: {
    position: 'absolute',
    width: 40,
    height: 40,
    bottom: 10,
    right: 30,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FF8852',
    borderRadius: 5,
    alignItems: 'center',
    width: 200,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  previewImageContainer: {
    position: 'relative',
    width: '80%',
    height: '60%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  qrCodePreviewOverlay: {
    position: 'absolute',
    width: 80,
    height: 80,
    bottom: 100,
    right: 120,
  },
  previewCloseButton: {
    backgroundColor: '#FF8852',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    width: 200,
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: 200,
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SetOnLockScreen;
