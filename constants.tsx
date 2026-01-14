
import { Lesson, LessonCategory } from './types';

export const LESSONS: Lesson[] = [
  {
    id: 'linear-regression',
    title: 'Linear Regression',
    shortDescription: 'The bedrock of prediction. Learn how to find the "line of best fit".',
    category: LessonCategory.FOUNDATIONS,
    difficulty: 'Beginner',
    steps: [
      {
        title: 'Meet the Data',
        description: 'Imagine we are predicting house prices based on square footage. Each dot on the right represents a house.',
        actionLabel: 'Next: Start Predicting'
      },
      {
        title: 'The Guessing Game',
        description: 'Try to draw a line that goes through the middle of the cluster. This is your initial model.',
        interactiveComponent: 'RegressionLine',
        actionLabel: 'Next: Calculate Error'
      },
      {
        title: 'Minimize the Squares',
        description: 'We measure error by squaring the vertical distance from points to the line. Try to make those red squares as small as possible!',
        interactiveComponent: 'RegressionError',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'gradient-descent',
    title: 'Gradient Descent',
    shortDescription: 'The engine of ML optimization. Learn how models "climb down" to find the truth.',
    category: LessonCategory.FOUNDATIONS,
    difficulty: 'Intermediate',
    steps: [
      {
        title: 'The Error Valley',
        description: 'Imagine the models error is a mountain. To minimize error, we need to find the lowest point in the valley.',
        actionLabel: 'Take a Step'
      },
      {
        title: 'Learning Rate Matters',
        description: 'Take steps towards the bottom. If your steps are too big, you will overshoot! If they are too small, it takes forever.',
        interactiveComponent: 'DescentSimulation',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'logistic-regression',
    title: 'Logistic Regression',
    shortDescription: 'Predict probabilities and classify items using the Sigmoid curve.',
    category: LessonCategory.SUPERVISED,
    difficulty: 'Beginner',
    steps: [
      {
        title: 'Yes or No?',
        description: 'Unlike Linear Regression which predicts numbers, Logistic Regression predicts the probability of a category.',
        actionLabel: 'Adjust Threshold'
      },
      {
        title: 'The Sigmoid Curve',
        description: 'The S-curve squashes any input to a value between 0 and 1. Where do you draw the line between classes?',
        interactiveComponent: 'LogisticSimulation',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'knn',
    title: 'K-Nearest Neighbors',
    shortDescription: 'Classify items based on who their neighbors are. Simple but powerful.',
    category: LessonCategory.SUPERVISED,
    difficulty: 'Beginner',
    steps: [
      {
        title: 'Who are your Neighbors?',
        description: 'Click anywhere on the map to place a new data point. The model will look at the "K" closest existing points to decide what you are.',
        actionLabel: 'Change K-Value'
      },
      {
        title: 'The Majority Vote',
        description: 'If 3 of your neighbors are blue and 2 are purple, you become blue. Adjust K to see how the neighborhood boundaries shift.',
        interactiveComponent: 'KNNSimulation',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'decision-trees',
    title: 'Decision Trees',
    shortDescription: 'Learn how to make complex decisions by asking a series of simple questions.',
    category: LessonCategory.SUPERVISED,
    difficulty: 'Beginner',
    steps: [
      {
        title: 'Divide and Conquer',
        description: 'A Decision Tree splits data based on features. Pick a threshold (like square footage) to separate high-value houses from low-value ones.',
        actionLabel: 'Add a Split'
      },
      {
        title: 'Maximizing Purity',
        description: 'The goal is to make the groups as "pure" as possible. If a leaf node only contains one type of data, your tree is doing great!',
        interactiveComponent: 'DecisionTreeSimulation',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'random-forest',
    title: 'Random Forest',
    shortDescription: 'A "Wisdom of the Crowd" approach using dozens of Decision Trees.',
    category: LessonCategory.SUPERVISED,
    difficulty: 'Intermediate',
    steps: [
      {
        title: 'Strength in Numbers',
        description: 'One tree might be biased, but 100 trees voting together are rarely wrong. This is an Ensemble method.',
        actionLabel: 'Run the Forest'
      },
      {
        title: 'Aggregated Voting',
        description: 'See how different trees look at different features and combine their votes to make a final prediction.',
        interactiveComponent: 'ForestSimulation',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'svm',
    title: 'Support Vector Machines',
    shortDescription: 'Find the "Maximum Margin" to separate classes with high confidence.',
    category: LessonCategory.SUPERVISED,
    difficulty: 'Intermediate',
    steps: [
      {
        title: 'The Great Divider',
        description: 'SVMs dont just separate data; they look for the widest possible "street" or margin between classes.',
        actionLabel: 'Maximize Margin'
      },
      {
        title: 'Support Vectors',
        description: 'The points closest to the line are the "Support Vectors". If they move, the whole boundary changes.',
        interactiveComponent: 'SVMSimulation',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'cnn-filters',
    title: 'CNN Filters',
    shortDescription: 'How computers "see" images by detecting edges, shapes, and textures.',
    category: LessonCategory.SUPERVISED,
    difficulty: 'Intermediate',
    steps: [
      {
        title: 'The Convolution',
        description: 'Computers use "kernels" or filters to scan an image and find specific patterns like vertical lines.',
        actionLabel: 'Scan Image'
      },
      {
        title: 'Feature Maps',
        description: 'The result of a scan is a feature map. Sliding the filter pixel by pixel creates an abstract version of the image.',
        interactiveComponent: 'CNNSimulation',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'overfitting',
    title: 'The Overfitting Trap',
    shortDescription: 'Why a "perfect" score on training data can lead to total failure in the real world.',
    category: LessonCategory.SUPERVISED,
    difficulty: 'Intermediate',
    steps: [
      {
        title: 'Simple is Better?',
        description: 'A model that is too simple (Degree 1) fails to capture the underlying pattern. This is called Underfitting.',
        actionLabel: 'Increase Complexity'
      },
      {
        title: 'Chasing the Noise',
        description: 'Slide the complexity to the maximum. Notice how the line wiggles to hit every single point? That model is memorizing noise.',
        interactiveComponent: 'ComplexitySlider',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'neural-networks',
    title: 'Neural Networks',
    shortDescription: 'The building blocks of AI. Learn how weights and activations mimic the brain.',
    category: LessonCategory.SUPERVISED,
    difficulty: 'Intermediate',
    steps: [
      {
        title: 'Weights and Signals',
        description: 'Neurons take signals, multiply them by "weights", and pass them on. Adjust the weights to light up the final output.',
        actionLabel: 'Tune the Network'
      },
      {
        title: 'Non-Linearity',
        description: 'By stacking these simple layers, Neural Networks can learn incredibly complex patterns that lines and trees cant.',
        interactiveComponent: 'NeuralNetSimulation',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'clustering',
    title: 'K-Means Clustering',
    shortDescription: 'Let the data speak for itself. Group similar items without any labels.',
    category: LessonCategory.UNSUPERVISED,
    difficulty: 'Beginner',
    steps: [
      {
        title: 'No Labels, No Problem',
        description: 'In Unsupervised Learning, we dont tell the computer the answer. It has to find clusters on its own.',
        actionLabel: 'Move the Centroids'
      },
      {
        title: 'Minimize Inertia',
        description: 'Drag the centroids around. Your goal is to find the center of each group to minimize the total "Inertia" (sum of distances).',
        interactiveComponent: 'ClusteringSimulation',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'pca',
    title: 'PCA (Principal Components)',
    shortDescription: 'Simplify complex data by projecting it onto the most important directions.',
    category: LessonCategory.UNSUPERVISED,
    difficulty: 'Advanced',
    steps: [
      {
        title: 'Squashing Data',
        description: 'PCA reduces dimensions while keeping as much information as possible. Rotate the axis to find the widest spread.',
        actionLabel: 'Rotate Projection'
      },
      {
        title: 'Maximum Variance',
        description: 'When the points are most spread out on the line, you have found the Principal Component!',
        interactiveComponent: 'PCASimulation',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'reinforcement-learning',
    title: 'Reinforcement Learning',
    shortDescription: 'Teach an agent to solve problems through trial, error, and rewards.',
    category: LessonCategory.FOUNDATIONS,
    difficulty: 'Advanced',
    steps: [
      {
        title: 'The Reward Loop',
        description: 'An agent explores an environment. It gets a cookie for reaching the goal and a zap for hitting a wall.',
        actionLabel: 'Start Training'
      },
      {
        title: 'Q-Learning',
        description: 'Over time, the agent builds a "map" of rewards. Watch it learn the optimal path from scratch.',
        interactiveComponent: 'ReinforcementSimulation',
        actionLabel: 'Finish Lesson'
      }
    ]
  },
  {
    id: 'algorithmic-bias',
    title: 'Algorithmic Bias',
    shortDescription: 'Understanding how historical prejudices leak into automated decisions.',
    category: LessonCategory.ETHICS,
    difficulty: 'Beginner',
    steps: [
      {
        title: 'Control the Training Bias',
        description: 'Use the slider to decide how biased your historical hiring data is. This is the "Garbage In" phase.',
        actionLabel: 'See Prediction Results'
      },
      {
        title: 'The Unfair Model',
        description: 'Observe how the model learned from your skewed data. It often weights gender more heavily than actual merit.',
        interactiveComponent: 'BiasSimulation',
        actionLabel: 'Finish Lesson'
      }
    ]
  }
];
