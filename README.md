# FFA (Fish Fillet Analyzer) - User Interface

A Vue.js web application for fish fillet analysis and lot management. This interface provides tools for managing fish lots, configuring analysis parameters, and viewing analysis results.

## 🐟 Overview

The FFA User Interface is a comprehensive web application designed for fish processing facilities to manage and analyze fish fillets. It provides real-time analysis capabilities, lot management, and detailed logging of fish parameters.

## 🚀 Features

### Core Functionality
- **Lot Management**: Create, edit, and manage fish lots with detailed information
- **Real-time Analysis**: Live fish fillet analysis with computer vision
- **Search & Filter**: Advanced search capabilities across lots by WMS code, lot number, or supplier
- **Logging System**: Comprehensive logging of analysis results and fish parameters
- **Configuration Management**: Equipment calibration and fish species parameter configuration

### Key Components
- **Lot Selection**: Choose lots for analysis with intelligent navigation
- **Analysis Dashboard**: Real-time analysis interface with live camera feed
- **Log Viewer**: Detailed history of analyzed samples with images
- **Configuration Panel**: System settings and calibration tools
- **Parameter Management**: Fish species and type parameter configuration

## 📁 Project Structure

```
src/
├── components/           # Reusable Vue components
│   ├── lotList.vue      # Lot listing with search functionality
│   ├── addLot.vue       # Add/edit lot modal
│   ├── calibrateScale.vue
│   ├── lineChart.vue
│   ├── MovingLine.vue
│   └── ...
├── views/               # Page components
│   ├── LotInfo.vue      # Main lot management page
│   ├── Log.vue          # Analysis history and results
│   ├── HomeView.vue     # Analysis dashboard
│   ├── Configuration.vue
│   ├── FishParameters.vue
│   └── ...
├── router/              # Vue Router configuration
├── store/               # Vuex state management
├── config/              # Application configuration
└── assets/              # Static assets
```

## 🛠️ Technology Stack

- **Frontend Framework**: Vue 3 with Composition API
- **UI Library**: Vuetify 3
- **State Management**: Vuex
- **Routing**: Vue Router
- **Real-time Communication**: Socket.IO
- **HTTP Client**: Axios
- **Build Tool**: Vue CLI

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with WebRTC support for camera functionality

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd user-interface
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Update configuration in `src/config/index.js`
   - Set server URLs and ports according to your backend setup

## 🚀 Development

### Start development server
```bash
npm run serve
```
The application will be available at `http://localhost:8080`

### Build for production
```bash
npm run build
```

### Run tests
```bash
npm run test
```

## 🎯 Usage Guide

### 1. Lot Management
- **Access**: Navigate to Configuration → Lot Information
- **Add Lot**: Click "Add new Lot #" to create a new lot
- **Search**: Use the search field to filter lots by WMS code, lot number, or supplier
- **Actions**: 
  - 🟢 **Green arrow**: Start analysis for selected lot
  - 🔵 **Blue list icon**: View analysis log for selected lot

### 2. Fish Analysis
- **Start Analysis**: Select a lot and click the green arrow or use "Analyse Lot" button
- **Live Feed**: View real-time camera feed with analysis overlay
- **Parameters**: System automatically applies species-specific parameters
- **Results**: Analysis results are automatically logged

### 3. Analysis Log
- **Access**: From lot management (blue icon) or analysis dashboard ("Log" button)
- **View Results**: Browse historical analysis data with images
- **Navigation**: Smart back button returns to origin (lot management or analysis)
- **Filters**: Built-in search and filtering capabilities

### 4. Configuration
- **Equipment Calibration**: 
  - Weight calibration for load cells
  - Length calibration for measurements
  - Zone of Interest (ZOI) calibration
- **Fish Parameters**: Configure species-specific analysis parameters
- **System Settings**: General application configuration

## 🔌 API Integration

The application communicates with a backend server for:
- **REST API**: Lot management, configuration, and data retrieval
- **WebSocket**: Real-time analysis data and camera feed
- **File Upload**: Image storage and retrieval

### Key Endpoints
- `GET /lots` - Retrieve lot list
- `POST /lots` - Create new lot
- `GET /lot_samples/{lot_no}` - Get analysis results
- `GET /get_config` - Retrieve system configuration
- `POST /update_config` - Update system parameters

## 🎨 UI Components

### LotList Component
- **Props**: `editable`, `selectable`, `showBothActions`, `searchQuery`
- **Events**: `rowClicked`, `editLot`
- **Features**: Real-time search, dual-action buttons, responsive design

### Navigation Flow
```
Lot Management → Analysis Dashboard → Log Viewer
     ↓              ↓                    ↓
   Select Lot → Analyze Fish → View Results
     ↓              ↓                    ↓
  Configure → Live Processing → Historical Data
```

## 🔍 Search Functionality

The application includes advanced search capabilities:
- **Multi-field search**: Searches across WMS code, lot number, and supplier
- **Real-time filtering**: Results update as you type
- **Case-insensitive**: Works regardless of text case
- **Clear functionality**: Easy reset of search filters

## 🎛️ Configuration Management

### Fish Parameters
- **Species Configuration**: Manage different fish species
- **Type Parameters**: Configure parameters for different fish types
- **Tail Trigger**: Set detection sensitivity
- **Real-time Updates**: Changes apply immediately to analysis

### Equipment Calibration
- **Load Cell**: Weight measurement calibration
- **Camera Calibration**: Length and dimension measurements
- **ZOI Setup**: Define analysis regions

## 🚨 Error Handling

The application includes comprehensive error handling:
- **Network Errors**: Graceful handling of connection issues
- **Validation**: Input validation with user-friendly messages
- **Loading States**: Clear indicators during data operations
- **Fallback UI**: Fallback content when data is unavailable

## 🔄 State Management

Using Vuex for centralized state management:
- **Current Lot**: Active lot being analyzed
- **Socket Connection**: WebSocket instance for real-time data
- **Analysis State**: Current analysis status and results

## 📱 Responsive Design

- **Mobile-friendly**: Responsive design works on tablets and mobile devices
- **Touch-optimized**: Touch-friendly buttons and interactions
- **Adaptive Layout**: UI adapts to different screen sizes

## 🛡️ Best Practices

- **Component Reusability**: Modular components for easy maintenance
- **Error Boundaries**: Proper error handling and user feedback
- **Performance**: Optimized for real-time data processing
- **Accessibility**: Following web accessibility guidelines

## 🐛 Troubleshooting

### Common Issues

1. **Camera not working**
   - Ensure browser has camera permissions
   - Check WebRTC support in browser
   - Verify backend camera service is running

2. **Connection errors**
   - Check backend server status
   - Verify network connectivity
   - Review configuration settings

3. **Search not working**
   - Check console for JavaScript errors
   - Verify data format from backend
   - Ensure search query is properly formatted

## 📈 Performance Optimization

- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Efficient image loading and caching
- **Real-time Throttling**: Controlled update frequency for live data
- **Memory Management**: Proper cleanup of event listeners and subscriptions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

[Add your license information here]

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Compatibility**: Vue 3, Vuetify 3, Modern Browsers
