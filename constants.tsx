
import React from 'react';
import { Lesson, LessonCategory } from './types';

export const LESSONS: Lesson[] = [
  {
    id: 'linear-regression',
    title: 'Linear Regression',
    shortDescription: 'The bedrock of prediction. Learn how to find the "line of best fit".',
    category: LessonCategory.FOUNDATIONS,
    difficulty: 'Beginner',
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <circle cx="20" cy="80" r="2" fill="currentColor" />
        <circle cx="40" cy="70" r="2" fill="currentColor" />
        <circle cx="60" cy="40" r="2" fill="currentColor" />
        <circle cx="80" cy="30" r="2" fill="currentColor" />
        <line x1="10" y1="90" x2="90" y2="20" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <path d="M10,20 Q50,110 90,20" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="25" cy="40" r="4" fill="#2A4D69">
          <animate attributeName="cx" values="25;50" dur="2s" repeatCount="indefinite" />
          <animate attributeName="cy" values="40;65" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <path d="M10,80 C40,80 60,20 90,20" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <circle cx="50" cy="50" r="4" fill="#2A4D69" />
        <circle cx="35" cy="40" r="2" fill="currentColor" />
        <circle cx="45" cy="30" r="2" fill="currentColor" />
        <circle cx="65" cy="45" r="2" fill="#E11D48" />
        <circle cx="55" cy="65" r="2" fill="#E11D48" />
        <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <rect x="45" y="10" width="10" height="10" fill="currentColor" />
        <line x1="50" y1="20" x2="30" y2="40" stroke="currentColor" strokeWidth="2" />
        <line x1="50" y1="20" x2="70" y2="40" stroke="currentColor" strokeWidth="2" />
        <circle cx="30" cy="45" r="5" fill="#2A4D69" />
        <rect x="65" y="40" width="10" height="10" fill="#E11D48" />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <g transform="scale(0.5) translate(25, 25)">
          <path d="M50 10 L20 60 L80 60 Z" fill="currentColor" />
        </g>
        <g transform="scale(0.5) translate(75, 50)">
          <path d="M50 10 L20 60 L80 60 Z" fill="currentColor" opacity="0.6" />
        </g>
        <g transform="scale(0.5) translate(10, 75)">
          <path d="M50 10 L20 60 L80 60 Z" fill="currentColor" opacity="0.8" />
        </g>
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="2" />
        <line x1="35" y1="15" x2="95" y2="75" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" opacity="0.3" />
        <line x1="5" y1="25" x2="65" y2="85" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" opacity="0.3" />
        <circle cx="20" cy="50" r="3" fill="#2A4D69" />
        <circle cx="80" cy="50" r="3" fill="#E11D48" />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1" />
        <rect x="30" y="30" width="20" height="20" fill="#D4A017" opacity="0.4" stroke="#D4A017" strokeWidth="1" />
        <line x1="20" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        <line x1="40" y1="20" x2="40" y2="80" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      </svg>
    ),
    steps: [
      {
        title: 'Phase 1: The Sliding Window',
        description: 'A CNN "scans" an image using a small matrix called a "Kernel". It multiplies the image by this kernel to highlight patterns like edges.',
        actionLabel: 'Next: Spatial Abstraction'
      },
      {
        title: 'Phase 2: Information Pooling',
        description: 'After filtering, models often "pool" or simplify the map. This reduces noise but also loses fine-grained details. Select a "Blur" filter to see info loss.',
        actionLabel: 'Next: The Texture Proxy'
      },
      {
        title: 'Phase 3: The Texture Proxy',
        description: 'Algorithmic bias in CNNs often comes from filters being overly sensitive to specific textures (like skin tone or lighting) that act as proxies for race or gender.',
        interactiveComponent: 'CNNBiasSimulation',
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <circle cx="20" cy="40" r="2" fill="currentColor" />
        <circle cx="40" cy="80" r="2" fill="currentColor" />
        <circle cx="60" cy="30" r="2" fill="currentColor" />
        <circle cx="80" cy="70" r="2" fill="currentColor" />
        <path d="M10,50 L20,40 L40,80 L60,30 L80,70 L90,60" fill="none" stroke="#E11D48" strokeWidth="2" strokeDasharray="2,2" />
      </svg>
    ),
    steps: [
      {
        title: 'Phase 1: The Rigid Model',
        description: 'A model that is too simple (Degree 1) fails to capture the underlying pattern. This is Underfitting. Notice how it misses the curvature of reality.',
        actionLabel: 'Test Generalization'
      },
      {
        title: 'Phase 2: Chasing the Noise',
        description: 'Now, we introduce Validation Data (red dots). Slide the complexity up. Notice how the line wiggles to hit training points but fails to predict the new ones.',
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <circle cx="20" cy="30" r="4" fill="currentColor" />
        <circle cx="20" cy="70" r="4" fill="currentColor" />
        <circle cx="50" cy="50" r="4" fill="currentColor" />
        <circle cx="80" cy="50" r="4" fill="#2A4D69" />
        <line x1="24" y1="30" x2="46" y2="48" stroke="currentColor" strokeWidth="1" />
        <line x1="24" y1="70" x2="46" y2="52" stroke="currentColor" strokeWidth="1" />
        <line x1="54" y1="50" x2="76" y2="50" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
    steps: [
      {
        title: 'Phase 1: The Synapse',
        description: 'Neural Networks are made of neurons connected by weights. Adjust θ1 and θ2 to see how the signal propagates to the output node.',
        actionLabel: 'Next: Layers of Logic'
      },
      {
        title: 'Phase 2: Hidden Depth',
        description: 'Hidden layers allow networks to learn non-linear patterns. Here, an intermediate layer processes signals before final classification.',
        actionLabel: 'Next: Ethical Audit'
      },
      {
        title: 'Phase 3: The Bias Signal',
        description: 'Algorithmic bias occurs when a network weights "Proxy Features" (like Zip Code) too heavily. Watch how the network learns to discriminate based on training data skew.',
        interactiveComponent: 'NeuralBiasSlider',
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <circle cx="30" cy="30" r="10" fill="#2A4D69" opacity="0.2" />
        <circle cx="70" cy="70" r="10" fill="#E11D48" opacity="0.2" />
        <rect x="28" y="28" width="4" height="4" fill="#2A4D69" />
        <rect x="68" y="68" width="4" height="4" fill="#E11D48" />
        <circle cx="25" cy="25" r="1" fill="currentColor" />
        <circle cx="35" cy="35" r="1" fill="currentColor" />
        <circle cx="65" cy="65" r="1" fill="currentColor" />
        <circle cx="75" cy="75" r="1" fill="currentColor" />
      </svg>
    ),
    steps: [
      {
        title: 'Phase 1: Gravity of Centers',
        description: 'In K-Means, we place "Centroids" (numbered squares) in the space. Each point joins the cluster of its nearest centroid. Drag them to see groups form.',
        actionLabel: 'Next: Auto-Convergence'
      },
      {
        title: 'Phase 2: The Mean Shift',
        description: 'K-Means is an algorithm. It works by repeatedly moving the centroid to the mathematical average (the "mean") of its group. Click "Run Optimization Step".',
        actionLabel: 'Next: Spatial Redlining'
      },
      {
        title: 'Phase 3: The Redlining Trap',
        description: 'Clustering on spatial data (location) can unintentionally create clusters that mimic demographic segregation. This is "Redlining via Algorithm".',
        interactiveComponent: 'ClusterBiasSlider',
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <circle cx="30" cy="70" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="70" cy="30" r="2" fill="currentColor" opacity="0.3" />
        <line x1="10" y1="90" x2="90" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" />
        <circle cx="20" cy="80" r="3" fill="#2A4D69" />
        <circle cx="80" cy="20" r="3" fill="#2A4D69" />
      </svg>
    ),
    steps: [
      {
        title: 'Phase 1: Axis Intuition',
        description: 'PCA reduces dimensions by projecting 2D data onto a 1D line. Rotate the axis to find the direction where the data is most spread out.',
        actionLabel: 'Next: Information Loss'
      },
      {
        title: 'Phase 2: The Cost of Compression',
        description: 'Simplifying data always has a cost. The red lines represent the "Residuals"—the information we lose when we flatten the world.',
        actionLabel: 'Next: Demographic Distillation'
      },
      {
        title: 'Phase 3: The Proxy Trap',
        description: 'When we distill data into its "Principal Components," we might accidentally preserve discriminatory proxies (like Zip Code) while losing individual nuances.',
        interactiveComponent: 'PCABiasSlider',
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1" />
        <rect x="45" y="45" width="10" height="10" fill="currentColor" transform="rotate(45 50 50)" />
        <path d="M80,20 L85,15 L90,20 L85,25 Z" fill="#D4A017" />
        <path d="M55,45 Q70,45 80,25" fill="none" stroke="#D4A017" strokeWidth="1" strokeDasharray="2,2" />
      </svg>
    ),
    steps: [
      {
        title: 'Phase 1: The Reward Signal',
        description: 'The agent (black diamond) learns by receiving rewards (+100) and penalties (-100). Watch it explore the environment to find the goal.',
        actionLabel: 'Next: Risk vs Reward'
      },
      {
        title: 'Phase 2: The High-Risk Shortcut',
        description: 'Now, we introduce a "Shortcut" guarded by a "Hazard". By adjusting the "Risk Tolerance", you can influence if the agent takes the safe path or the dangerous one.',
        actionLabel: 'Next: The Redlining Loop'
      },
      {
        title: 'Phase 3: The Redlining Loop',
        description: 'Algorithmic bias in RL occurs when the cost of "service" in certain zones (B) is historically higher. The agent learns to avoid these zones entirely, effectively redlining them.',
        interactiveComponent: 'RLBiasSlider',
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
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <line x1="20" y1="50" x2="80" y2="70" stroke="currentColor" strokeWidth="2" />
        <line x1="50" y1="30" x2="50" y2="80" stroke="currentColor" strokeWidth="1" />
        <circle cx="20" cy="50" r="8" fill="#E11D48" />
        <circle cx="80" cy="70" r="8" fill="currentColor" />
      </svg>
    ),
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
