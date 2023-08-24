import { DataTypes } from 'sequelize';

const userModel = (sequelize) =>
  sequelize.define('users', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totalScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    progress: {
      type: DataTypes.JSON,
      defaultValue: {
        status: '',
        totalQuestionDone: 0,
        currentRound: 1,
        scoreOfCurrentRound: 0,
      },
    },
  });

export default userModel;
