import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem('tasks');
        if (storedTasks) {
          const parsedTasks = JSON.parse(storedTasks).map((task) => ({
            ...task,
            animation: new Animated.Value(1), // Initialize animation for each task
          }));
          setTasks(parsedTasks);
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    };
    loadTasks();
  }, []);

  useEffect(() => {
    const saveTasks = async () => {
      try {
        const tasksToSave = tasks.map(({ animation, ...rest }) => rest); // Exclude animation before saving
        await AsyncStorage.setItem('tasks', JSON.stringify(tasksToSave));
      } catch (error) {
        console.error('Failed to save tasks:', error);
      }
    };
    saveTasks();
  }, [tasks]);

  const addTask = () => {
    if (task.trim()) {
      const newTask = {
        id: Date.now().toString(),
        text: task,
        completed: false,
        animation: new Animated.Value(0), // Initialize animation value for fade-in
      };
      setTasks([...tasks, newTask]);
      setTask('');
      Animated.timing(newTask.animation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  const deleteTask = (taskId) => {
    const taskToDelete = tasks.find((task) => task.id === taskId);

    if (taskToDelete) {
      Animated.timing(taskToDelete.animation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setTasks(tasks.filter((task) => task.id !== taskId));
      });
    }
  };

  const toggleTaskCompletion = (taskId) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const enableEdit = (taskId, currentText) => {
    setEditingTaskId(taskId);
    setEditingText(currentText);
  };

  const updateTask = () => {
    setTasks(
      tasks.map((task) =>
        task.id === editingTaskId
          ? { ...task, text: editingText }
          : task
      )
    );
    setEditingTaskId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple To-Do List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task"
          value={task}
          onChangeText={(text) => setTask(text)}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <Animated.View
            style={[
              styles.taskContainer,
              { opacity: item.animation, transform: [{ scale: item.animation }] },
            ]}
          >
            {editingTaskId === item.id ? (
              <TextInput
                style={[styles.input, styles.editInput]}
                value={editingText}
                onChangeText={(text) => setEditingText(text)}
                autoFocus
              />
            ) : (
              <TouchableOpacity
                style={styles.taskTextContainer}
                onPress={() => toggleTaskCompletion(item.id)}
                onLongPress={() => enableEdit(item.id, item.text)}
              >
                <Text
                  style={[
                    styles.taskText,
                    item.completed && styles.completedTaskText,
                  ]}
                >
                  {item.text}
                </Text>
              </TouchableOpacity>
            )}
            {editingTaskId === item.id ? (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={updateTask}>
                  <Text style={styles.saveButton}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelEdit}>
                  <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => deleteTask(item.id)}>
                <Text style={styles.deleteButton}>X</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  editInput: {
    backgroundColor: '#e6f7ff',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#95a5a6',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
    marginHorizontal: 5,
  },
  cancelButton: {
    color: '#E74C3C',
    fontWeight: 'bold',
    fontSize: 16,
    marginHorizontal: 5,
  },
  deleteButton: {
    color: '#E74C3C',
    fontWeight: 'bold',
    fontSize: 18,
    padding: 5,
  },
});
