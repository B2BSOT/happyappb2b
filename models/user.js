'"use strict';

module.exports = function(sequelize, DataTypes) {
    var user = sequelize.define('user', {
                        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
                        user_name: {type: DataTypes.STRING, allowNull: false},
                        email: {type: DataTypes.STRING, allowNull: false},
                        phone_number: {type: DataTypes.STRING, allowNull: false},
                        emp_num: {type: DataTypes.STRING, allowNull: false},
                        team_id: {type: DataTypes.STRING, allowNull: false},
                        sm_id: {type: DataTypes.STRING, allowNull: false},
                        role: {type: DataTypes.STRING, allowNull: false},
                        birthday: {type: DataTypes.STRING, allowNull: false},
                        blood_type: {type: DataTypes.STRING, allowNull: false},
                        mbti_type: {type: DataTypes.STRING, allowNull: false},
                        marriage_yn: {type: DataTypes.STRING, allowNull: false},
                        wedding_aniv: {type: DataTypes.STRING, allowNull: false},
                        happy_point: {type: DataTypes.INTEGER, allowNull: false},
                        mileage: {type: DataTypes.INTEGER, allowNull: false},
                        user_img: {type: DataTypes.STRING, allowNull: false},
                        address: {type: DataTypes.STRING, allowNull: false},
                        home_town: {type: DataTypes.STRING, allowNull: false}
                    },{
                        classMethods: {},
                        tableName: 'user', // 쿼리에서의 테이블 이름을 설정
                        freezeTableName: true,  // true이면 tableName에 설정한 이름으로만 쿼리 생성
                        underscored: true,
                        timestamps: false // true이면 자동으로 등록시간, 수정시간 만들어줌
                    });
                    
    return user;
}