'"use strict';

module.exports = function(sequelize, DataTypes) {
    var login_hst = sequelize.define('login_hst', {
                        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
                        login_id: {type: DataTypes.INTEGER, allowNull: false},
                        reg_dtm: {type: DataTypes.STRING, allowNull: true},
                        login_dt: {type: DataTypes.STRING, allowNull: true},
                        login_cnt: {type: DataTypes.INTEGER, allowNull: true},
                        update_dtm: {type: DataTypes.STRING, allowNull: true}
                    },{
                        classMethods: {},
                        tableName: 'login_hst', // 쿼리에서의 테이블 이름을 설정
                        freezeTableName: true,  // true이면 tableName에 설정한 이름으로만 쿼리 생성
                        underscored: true,
                        timestamps: false // true이면 자동으로 등록시간, 수정시간 만들어줌
                    });
                    
    return login_hst;
}