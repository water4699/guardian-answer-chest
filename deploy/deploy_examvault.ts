import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log(`Deploying ExamVault contract from account: ${deployer}`);

  const deployed = await deploy("ExamVault", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // Speed up deployment on local network
  });

  console.log(`ExamVault contract deployed at: ${deployed.address}`);
  console.log(`Deployment gas used: ${deployed.receipt?.gasUsed || 'N/A'}`);
};

export default func;
func.id = "deploy_examvault";
func.tags = ["ExamVault"];
