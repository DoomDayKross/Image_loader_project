//TEST//
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  Button,
  Image,
  ActivityIndicator,
  StyleSheet,
  PermissionsAndroid,
  Platform
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import NetInfo from '@react-native-community/netinfo';

const BACKGROUND_FETCH_TASK = 'background-fetch-task';

const App = () => {
  const [url, setUrl] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.INTERNET
      );
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_NETWORK_STATE
      );
    }

    // Request notification permissions for iOS and Android
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission for notifications not granted!');
    }
  };

  useEffect(() => {
    requestPermissions();
    configureBackgroundService();
  }, []);

  const configureBackgroundService = () => {
    // Register the background task
    TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
      // Trigger a local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Image Loader Service',
          body: 'Image Loader Service is running',
        },
        trigger: null,
      });
    });

    // Start background task (fetching periodically)
    const startBackgroundFetch = async () => {
      await TaskManager.startTask(BACKGROUND_FETCH_TASK);
    };

    startBackgroundFetch();
  };

  const loadImage = async () => {
    setError(null);  // Reset previous error
    setImageUri(null); // Reset previous image
    setLoading(true); // Show loading indicator

    try {
      // Check if the URL is valid
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load image.');
      }
      setImageUri(url); // If successful, set image URI
    } catch (err) {
      // Handle network errors or invalid URL
      setError('Failed to load image.');
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter image URL"
        value={url}
        onChangeText={setUrl}
      />
      <Button
        title="Load Image"
        onPress={loadImage}
        disabled={!isConnected}
      />
      {!isConnected && <Text style={styles.warning}>No internet connection</Text>}
      
      {/* Show loading message while image is being fetched */}
      {loading && <Text style={styles.loadingMessage}>Loading...</Text>}
      
      {/* Show error message if image failed to load */}
      {error && <Text style={styles.error}>{error}</Text>}
      
      {/* Display image if successfully fetched */}
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  warning: {
    color: 'orange',
    marginVertical: 10,
  },
  error: {
    color: 'red',
    marginVertical: 10,
  },
  loadingMessage: {
    color: 'gray',
    fontSize: 18,
    marginVertical: 10,
  },
  image: {
    width: '100%',
    height: 300,
    marginTop: 20,
  },
});

export default App;
