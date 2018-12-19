'"use strict';

module.exports = function(sequelize, DataTypes) {
    var com_mileage = sequelize.define('com_mileage', {
                        mileage_id: {type: DataTypes.STRING, primaryKey: true},
                        route_path: {type: DataTypes.STRING, allowNull: false},
                        use_type: {type: DataTypes.STRING, allowNull: false},
                        mileage: {type: DataTypes.INTEGER, allowNull: false},
                        reg_dtm: {type: DataTypes.STRING, allowNull: true},
                        modify_dtm: {type: DataTypes.STRING, allowNull: true},
                        desc: {type: DataTypes.STRING, allowNull: true}
                    },{
                        classMethods: {},
                        tableName: 'com_mileage', // 쿼리에서의 테이블 이름을 설정
                        freezeTableName: true,  // true이면 tableName에 설정한 이름으로만 쿼리 생성
                        underscored: true,
                        timestamps: false // true이면 자동으로 등록시간, 수정시간 만들어줌
                    });
                    
    return com_mileage;
}