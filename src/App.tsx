import VideoPlayerContainer from './components/custom/VideoPlayerContainer';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Video Player App
        </h1>
        <VideoPlayerContainer />
      </div>
    </div>
  );
};

export default App;
