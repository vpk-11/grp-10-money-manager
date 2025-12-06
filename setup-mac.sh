#!/bin/bash

# AI Chatbot Setup Script for Money Manager
# This script automates the installation of Ollama and required AI models

set -e  # Exit on error

echo "=========================================="
echo "Money Manager - AI Chatbot Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Ollama is installed
check_ollama() {
    if command -v ollama &> /dev/null; then
        echo -e "${GREEN}✓ Ollama is already installed${NC}"
        return 0
    else
        echo -e "${YELLOW}✗ Ollama is not installed${NC}"
        return 1
    fi
}

# Install Ollama
install_ollama() {
    echo ""
    echo -e "${BLUE}Installing Ollama...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ollama
        else
            echo -e "${YELLOW}Homebrew not found. Installing Ollama manually...${NC}"
            curl -fsSL https://ollama.com/install.sh | sh
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://ollama.com/install.sh | sh
    else
        echo -e "${RED}Unsupported operating system${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Ollama installed successfully${NC}"
}

# Start Ollama service
start_ollama() {
    echo ""
    echo -e "${BLUE}Starting Ollama service...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start ollama
    else
        ollama serve &
    fi
    
    # Wait for Ollama to start
    echo "Waiting for Ollama to start..."
    sleep 3
    
    echo -e "${GREEN}✓ Ollama service started${NC}"
}

# Check if Ollama is running
check_ollama_running() {
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Ollama is running${NC}"
        return 0
    else
        echo -e "${YELLOW}✗ Ollama is not running${NC}"
        return 1
    fi
}

# Pull AI model
pull_model() {
    local model=$1
    echo ""
    echo -e "${BLUE}Pulling model: $model...${NC}"
    echo "This may take a few minutes depending on your internet connection..."
    
    ollama pull "$model"
    
    echo -e "${GREEN}✓ Model $model installed successfully${NC}"
}

# Main installation flow
main() {
    echo "This script will set up the AI chatbot for Money Manager"
    echo ""
    
    # Step 1: Check/Install Ollama
    if ! check_ollama; then
        read -p "Would you like to install Ollama? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_ollama
        else
            echo -e "${RED}Ollama is required for the AI chatbot. Exiting.${NC}"
            exit 1
        fi
    fi
    
    # Step 2: Start Ollama
    if ! check_ollama_running; then
        start_ollama
        sleep 2
        if ! check_ollama_running; then
            echo -e "${RED}Failed to start Ollama. Please start it manually.${NC}"
            exit 1
        fi
    fi
    
    # Step 3: Install AI models
    echo ""
    echo "=========================================="
    echo "Available AI Models"
    echo "=========================================="
    echo ""
    echo "1. llama3.2:1b (1.3GB)   - Lightning quick, basic accuracy (default)"
    echo "2. llama3.2:3b (2.0GB)   - Balanced speed & intelligence"
    echo "3. Install both models"
    echo "4. Skip model installation"
    echo ""
    
    read -p "Select model(s) to install (1-4): " choice
    
    case $choice in
        1)
            pull_model "llama3.2:1b"
            ;;
        2)
            pull_model "llama3.2:3b"
            ;;
        3)
            echo -e "${BLUE}Installing both Llama 3.2 models...${NC}"
            pull_model "llama3.2:1b"
            pull_model "llama3.2:3b"
            ;;
        4)
            echo -e "${YELLOW}Skipping model installation${NC}"
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    # Final message
    echo ""
    echo "=========================================="
    echo -e "${GREEN}Setup Complete!${NC}"
    echo "=========================================="
    echo ""
    echo "You can now use the AI chatbot in Money Manager!"
    echo ""
    echo "To start/stop Ollama:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  Start:  brew services start ollama"
        echo "  Stop:   brew services stop ollama"
    else
        echo "  Start:  ollama serve"
        echo "  Stop:   pkill ollama"
    fi
    echo ""
    echo "To install additional models later:"
    echo "  ollama pull <model-name>"
    echo ""
    echo "For help:"
    echo "  ollama --help"
    echo ""
}

# Run main function
main
