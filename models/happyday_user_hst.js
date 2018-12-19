'"use strict';

module.exports = function(sequelize, DataTypes) {
    var happyday_user_hst = sequelize.define('happyday_user_hst', {
                        user_id: {type: DataTypes.INTEGER, primaryKey: true},
                        happyday_id: {type: DataTypes.INTEGER, primaryKey: true},
                        reg_dtm: {type: DataTypes.STRING, allowNull: true},
                        modify_dtm: {type: DataTypes.STRING, allowNull: true},
                        use_point: {type: DataTypes.INTEGER, allowNull: true},
                        state: {type: DataTypes.STRING, allowNull: false}
                    },{
                        classMethods: {},
                        tableName: 'happyday_user_hst', // 쿼리에서의 테이블 이름을 설정
                        freezeTableName: true,  // true이면 tableName에 설정한 이름으로만 쿼리 생성
                        underscored: true,
                        timestamps: false // true이면 자동으로 등록시간, 수정시간 만들어줌
                    });
                    
    return happyday_user_hst;
}