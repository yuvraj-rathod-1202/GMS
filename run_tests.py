import os
import subprocess
import sys
import argparse

SERVICES = [
    "analytics",
    "auth_user",
    "courses",
    "gateway",
    "marks",
    "policy",
]

def run_frontend_tests():
    print("="*50)
    print("Running Frontend Tests")
    print("="*50)
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    result = subprocess.run(["npm", "test"], cwd=frontend_dir, shell=True)
    return result.returncode == 0

def run_backend_test(service_name):
    print("="*50)
    print(f"Running Backend Tests: {service_name}")
    print("="*50)
    service_dir = os.path.join(os.path.dirname(__file__), service_name)
    
    # We use the python executable from the virtual environment if it exists
    venv_python = os.path.join(service_dir, ".venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        print(f"Warning: Virtual environment not found for {service_name} at {venv_python}. Using default python.")
        venv_python = sys.executable
    
    # Ensure pytest and httpx are installed in the service's environment
    subprocess.run([venv_python, "-m", "pip", "install", "pytest", "httpx", "fastapi"], cwd=service_dir, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Run pytest
    result = subprocess.run([venv_python, "-m", "pytest", "tests/"], cwd=service_dir)
    return result.returncode == 0

def main():
    parser = argparse.ArgumentParser(description="Run unit tests for MMS")
    parser.add_argument("target", nargs="?", default="all", help="Target to test: 'all', 'frontend', or a service name")
    
    args = parser.parse_args()
    target = args.target.lower()
    
    success = True
    
    if target == "all":
        if not run_frontend_tests():
            success = False
        for service in SERVICES:
            if not run_backend_test(service):
                success = False
    elif target == "frontend":
        success = run_frontend_tests()
    elif target in SERVICES:
        success = run_backend_test(target)
    else:
        print(f"Unknown target: {target}")
        print(f"Available targets: all, frontend, {', '.join(SERVICES)}")
        sys.exit(1)
        
    if success:
        print("\nAll tests passed successfully!")
        sys.exit(0)
    else:
        print("\nSome tests failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
