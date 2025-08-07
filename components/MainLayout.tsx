
import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [chatPanel, insightsPanel] = React.Children.toArray(children);

  return (
    <div className="h-screen w-screen bg-gray-900 grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
      <div className="md:col-span-3 h-full flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-white/20">
        {chatPanel}
      </div>
      <div className="hidden md:flex md:col-span-2 h-full flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-white/20">
        {insightsPanel}
      </div>
    </div>
  );
};

export default MainLayout;